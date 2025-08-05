import React, { useState, useEffect } from "react";
import socket from "../../socket";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("chat-message", ({ userNumber, message }) => {
      setMessages((prev) => [...prev, `User ${userNumber}: ${message}`]);
    });

    return () => socket.off("chat-message");
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("chat-message", text);
    setText("");
  };

  return (
    <div style={{ flex: 1, borderLeft: "2px solid #ccc", padding: 10 }}>
      <h3>Group Chat</h3>
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #aaa",
          marginBottom: 10,
          padding: 5,
        }}
      >
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
