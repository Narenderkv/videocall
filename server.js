const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// User tracking
const users = new Set();
const userNumbers = new Map(); // socket.id -> userNumber
const userNumberSet = new Set(); // Ensure uniqueness

// Room route
app.get('/room', (req, res) => {
  res.render('room');
});

io.on('connection', socket => {
  socket.on('join', (userNumber) => {
    if (!userNumber) {
      console.log(`[server] Missing userNumber for socket.id=${socket.id}`);
      socket.emit('error', 'User number required in URL (?user=)');
      socket.disconnect();
      return;
    }

    if (userNumberSet.has(userNumber)) {
      console.log(`[server] Duplicate userNumber: ${userNumber}`);
      socket.emit('error', 'User number already in use. Choose a different one.');
      socket.disconnect();
      return;
    }

    userNumbers.set(socket.id, userNumber);
    userNumberSet.add(userNumber);
    users.add(socket.id);

    console.log(`[server] User joined: socket.id=${socket.id}, userNumber=${userNumber}`);

    const userList = Array.from(users).map(id => ({
      id,
      userNumber: userNumbers.get(id)
    }));
    io.emit('users', userList);
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    const userNumber = userNumbers.get(socket.id);
    if (userNumber) userNumberSet.delete(userNumber);
    userNumbers.delete(socket.id);

    console.log(`[server] User disconnected: ${socket.id}`);
    io.emit('user-disconnected', socket.id);

    const userList = Array.from(users).map(id => ({
      id,
      userNumber: userNumbers.get(id)
    }));
    io.emit('users', userList);
  });

  // WebRTC signaling forwarding
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/room');
});
