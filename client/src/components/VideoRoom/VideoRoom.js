import React, { useEffect, useRef, useState } from "react";
import socket from "../../socket";

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

function VideoRoom({ roomId, user }) {
  const localVideoRef = useRef();
  const [localStream, setLocalStream] = useState(null);
  const peerConnectionsRef = useRef({}); // ✅ persistent ref
  const [remoteStreams, setRemoteStreams] = useState({});
  const [users, setUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    socket.connect();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;
      setLocalStream(stream);

      socket.emit("join-room", { roomId, name: user.name, email: user.email });
    });

    socket.on("users", (userList) => {
      setUsers(userList);

      userList.forEach((u) => {
        if (u.id === socket.id) return;

        // Create connection if not exists
        if (!peerConnectionsRef.current[u.id]) {
          startPeerConnection(u.id, socket.id < u.id); 
        }
      });
    });

    socket.on("offer", async ({ from, offer }) => {
      let pc = peerConnectionsRef.current[from];
      if (!pc) {
        pc = startPeerConnection(from, false);
      }

      // Only handle offer if stable
      if (pc.signalingState === "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, answer });
      } else {
        console.warn("Offer ignored, state:", pc.signalingState);
      }
    });

    socket.on("answer", async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from];
      if (!pc) return;

      // Only set remote answer if in "have-local-offer"
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } else {
        console.warn("Ignoring unexpected answer, state:", pc.signalingState);
      }
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("user-disconnected", (id) => {
      const pc = peerConnectionsRef.current[id];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[id];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });

    return () => socket.disconnect();
    // eslint-disable-next-line
  }, []);

  function startPeerConnection(remoteId, isInitiator) {
    const pc = new RTCPeerConnection(config);
    peerConnectionsRef.current[remoteId] = pc;

    // Add local tracks
    localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({ ...prev, [remoteId]: event.streams[0] }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: remoteId, candidate: event.candidate });
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("offer", { to: remoteId, offer: pc.localDescription });
        });
    }

    return pc;
  }

  const toggleMute = () => {
    if (!localStream) return;
    const newMute = !isMuted;
    localStream.getAudioTracks().forEach((track) => (track.enabled = !newMute));
    setIsMuted(newMute);
  };

  return (
    <div>
      <h2>Meeting Room: {roomId}</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4>{user.name} (You)</h4>
          <video ref={localVideoRef} autoPlay muted playsInline width="320" height="240" />
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
        </div>

        {Object.entries(remoteStreams).map(([id, stream]) => (
          <div key={id}>
            <h4>{users.find((u) => u.id === id)?.name || "Remote"}</h4>
            <video
              autoPlay
              playsInline
              width="320"
              height="240"
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoRoom;
