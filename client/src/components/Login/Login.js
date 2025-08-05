import React, { useState } from "react";
import socket from "../../socket";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");

  const handleLogin = () => {
    if (!username.trim()) return;
    socket.connect(); // connect only after login
    onLogin(username);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20vh" }}>
      <h2>Login to Video Chat</h2>
      <input
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "8px" }}
      />
      <button onClick={handleLogin} style={{ marginLeft: "10px", padding: "8px 12px" }}>
        Join
      </button>
    </div>
  );
}
