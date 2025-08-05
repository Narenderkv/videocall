import React, { useState } from "react";
import { useParams } from "react-router-dom";
import VideoRoom from "../components/VideoRoom/VideoRoom";
// import VideoRoom from "../components/VideoRoom";

function RoomPage() {
  const { roomId } = useParams();
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState({ name: "", email: "" });

  const handleJoin = (e) => {
    e.preventDefault();
    if (!user.name || !user.email) return alert("Name & Email required");
    setJoined(true);
  };

  if (!joined) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h2>Join Room: {roomId}</h2>
        <form onSubmit={handleJoin}>
          <input
            placeholder="Your Name"
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            required
          />
          <br />
          <input
            placeholder="Your Email"
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
          />
          <br />
          <button type="submit">Join Meeting</button>
        </form>
      </div>
    );
  }

  return <VideoRoom roomId={roomId} user={user} />;
}

export default RoomPage;
