const socket = io();
const localVideo = document.getElementById('localVideo');
const videoContainer = document.querySelector('.video-container');
let localStream;
const peerConnections = {}; // socketId -> RTCPeerConnection

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

// Get user number from URL
const params = new URLSearchParams(window.location.search);
const userNumber = params.get('user');

// Step 1: Get local stream
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;
    socket.emit('join', userNumber);
  })
  .catch(error => {
    console.error('Camera error:', error);
  });

// Keep track of users
let userList = [];

socket.on('users', (users) => {
  userList = users;
  console.log('[users event] Users:', users);

  // Clean up old videos
  document.querySelectorAll('.video-box').forEach(box => {
    if (box.id !== 'local-video-box') box.remove();
  });

  users.forEach(({ id, userNumber: remoteUserNumber }) => {
    if (id === socket.id || !remoteUserNumber) return;

    // Start peer connection if not already connected
    if (!peerConnections[id]) {
      const isInitiator = socket.id < id; // Deterministic initiator logic
      startPeerConnection(id, isInitiator);
    }

    let remoteVideo = document.getElementById('remoteVideo-' + id);
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.id = 'remoteVideo-' + id;
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideo.width = 320;
      remoteVideo.height = 240;

      const box = document.createElement('div');
      box.className = 'video-box';
      box.id = 'remote-box-' + id;

      const label = document.createElement('h3');
      label.textContent = `Remote Camera (User ${remoteUserNumber})`;

      box.appendChild(label);
      box.appendChild(remoteVideo);
      videoContainer.appendChild(box);
    }

    if (peerConnections[id].remoteStream) {
      remoteVideo.srcObject = peerConnections[id].remoteStream;
    }
  });
});

socket.on('disconnect', () => {
  setTimeout(() => window.location.reload(), 1000);
});

socket.on('offer', async (data) => {
  startPeerConnection(data.from, false);
  await peerConnections[data.from].setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnections[data.from].createAnswer();
  await peerConnections[data.from].setLocalDescription(answer);
  socket.emit('answer', { to: data.from, answer });
});

socket.on('answer', async (data) => {
  if (peerConnections[data.from]) {
    await peerConnections[data.from].setRemoteDescription(new RTCSessionDescription(data.answer));
  }
});

socket.on('ice-candidate', (data) => {
  if (peerConnections[data.from]) {
    peerConnections[data.from].addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

socket.on('user-disconnected', (id) => {
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
  }
  const box = document.getElementById('remote-box-' + id);
  if (box) box.remove();
});

function startPeerConnection(id, isInitiator) {
  if (peerConnections[id]) return;

  const pc = new RTCPeerConnection(config);
  peerConnections[id] = pc;

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    let remoteVideo = document.getElementById('remoteVideo-' + id);
    if (!remoteVideo) return;
    remoteVideo.srcObject = event.streams[0];
    peerConnections[id].remoteStream = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { to: id, candidate: event.candidate });
    }
  };

  if (isInitiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('offer', { to: id, offer: pc.localDescription });
      });
  }
}
