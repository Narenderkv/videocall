const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const socketio = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const rooms = new Map(); 
// roomId -> Map(socketId -> { name, email, isHost, muted })

// ------------------ API ------------------
// Generate a new room link
app.get("/create-room", (req, res) => {
  const newRoomId = uuidv4();
  res.json({ roomId: newRoomId });
});

// ------------------ SOCKET.IO ------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, name, email }) => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);

    const isHost = room.size === 0; // first user is host
    room.set(socket.id, { name, email, isHost, muted: false });
    socket.join(roomId);
    socket.roomId = roomId;

    io.to(roomId).emit("users", getRoomUsers(roomId));
  });

  // Chat messages
  socket.on("chat-message", (message) => {
    const roomId = socket.roomId;
    const room = rooms.get(roomId);
    if (!room) return;
    const user = room.get(socket.id);
    io.to(roomId).emit("chat-message", { username: user.name, message });
  });

  // WebRTC signaling
  socket.on("offer", ({ to, offer }) => io.to(to).emit("offer", { from: socket.id, offer }));
  socket.on("answer", ({ to, answer }) => io.to(to).emit("answer", { from: socket.id, answer }));
  socket.on("ice-candidate", ({ to, candidate }) => io.to(to).emit("ice-candidate", { from: socket.id, candidate }));

  // Host mute/unmute control
  socket.on("mute-user", ({ targetId }) => {
    const roomId = socket.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const requester = room.get(socket.id);
    if (!requester?.isHost) return; // Only host can mute others

    const target = room.get(targetId);
    if (target) {
      target.muted = true;
      io.to(targetId).emit("force-mute");
      io.to(roomId).emit("users", getRoomUsers(roomId));
    }
  });

  socket.on("unmute-user", ({ targetId }) => {
    const roomId = socket.roomId;
    const room = rooms.get(roomId);
    if (!room) return;

    const requester = room.get(socket.id);
    if (!requester?.isHost) return;

    const target = room.get(targetId);
    if (target) {
      target.muted = false;
      io.to(targetId).emit("force-unmute");
      io.to(roomId).emit("users", getRoomUsers(roomId));
    }
  });

  // Disconnect logic
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.delete(socket.id);

    io.to(roomId).emit("user-disconnected", socket.id);
    io.to(roomId).emit("users", getRoomUsers(roomId));

    // cleanup empty rooms
    if (room.size === 0) rooms.delete(roomId);
  });
});

function getRoomUsers(roomId) {
  const room = rooms.get(roomId) || new Map();
  return Array.from(room.entries()).map(([id, u]) => ({ id, ...u }));
}

// ------------------ SERVE REACT BUILD ------------------
// Assuming your React app is in "client" folder
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
