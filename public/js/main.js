// const socket = io();
// const localVideo = document.getElementById('localVideo');
// const videoContainer = document.querySelector('.video-container');
// let localStream;
// const peerConnections = {}; // socketId -> RTCPeerConnection
// const messageInput = document.getElementById('message');
// const sendBtn = document.getElementById('sendBtn');
// const chatBox = document.getElementById('chat-box');
// const config = {
//   iceServers: [
//     { urls: 'stun:stun.l.google.com:19302' },
//     {
//       urls: 'turn:openrelay.metered.ca:80',
//       username: 'openrelayproject',
//       credential: 'openrelayproject'
//     }
//   ]
// };

// // Step 1: Get local stream
// navigator.mediaDevices.getUserMedia({ video: true, audio: true }) // ✅ enable audio
//   .then(stream => {
//     localVideo.srcObject = stream;
//     localStream = stream;
//     socket.emit('join');
//   })
//   .catch(error => {
//     console.error('Camera error:', error);
//   });

// const muteBtn = document.getElementById('muteBtn');
// let isMuted = false;

// muteBtn.addEventListener('click', () => {
//   if (localStream && localStream.getAudioTracks().length > 0) {
//     isMuted = !isMuted;
//     localStream.getAudioTracks().forEach(track => {
//       if (track.kind === 'audio') track.enabled = !isMuted;
//     });
//     muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
//   }
// });

// let userList = [];

// socket.on('users', (users) => {
//   userList = users;
//   console.log('[users event] Users:', users);

//   document.querySelectorAll('.video-box').forEach(box => {
//     if (box.id !== 'local-video-box') box.remove();
//   });

//   users.forEach(({ id }) => {
//     if (id === socket.id) return;

//     if (!peerConnections[id]) {
//       const isInitiator = socket.id < id;
//       startPeerConnection(id, isInitiator);
//     }

//     let remoteVideo = document.getElementById('remoteVideo-' + id);
//     if (!remoteVideo) {
//       remoteVideo = document.createElement('video');
//       remoteVideo.id = 'remoteVideo-' + id;
//       remoteVideo.autoplay = true;
//       remoteVideo.playsInline = true;
//       remoteVideo.width = 320;
//       remoteVideo.height = 240;

//       const box = document.createElement('div');
//       box.className = 'video-box';
//       box.id = 'remote-box-' + id;

//       const label = document.createElement('h3');
//       label.textContent = `Remote Camera`;

//       const muteRemoteBtn = document.createElement('button');
//       muteRemoteBtn.textContent = 'Mute Remote';
//       muteRemoteBtn.onclick = () => {
//         remoteVideo.muted = !remoteVideo.muted;
//         muteRemoteBtn.textContent = remoteVideo.muted ? 'Unmute Remote' : 'Mute Remote';
//       };

//       box.appendChild(label);
//       box.appendChild(remoteVideo);
//       box.appendChild(muteRemoteBtn);
//       videoContainer.appendChild(box);
//     }

//     if (peerConnections[id].remoteStream) {
//       remoteVideo.srcObject = peerConnections[id].remoteStream;
//     }
//   });
// });

// socket.on('disconnect', () => {
//   setTimeout(() => window.location.reload(), 1000);
// });

// socket.on('offer', async (data) => {
//   startPeerConnection(data.from, false);
//   await peerConnections[data.from].setRemoteDescription(new RTCSessionDescription(data.offer));
//   const answer = await peerConnections[data.from].createAnswer();
//   await peerConnections[data.from].setLocalDescription(answer);
//   socket.emit('answer', { to: data.from, answer });
// });

// socket.on('answer', async (data) => {
//   if (peerConnections[data.from]) {
//     await peerConnections[data.from].setRemoteDescription(new RTCSessionDescription(data.answer));
//   }
// });

// socket.on('ice-candidate', (data) => {
//   if (peerConnections[data.from]) {
//     peerConnections[data.from].addIceCandidate(new RTCIceCandidate(data.candidate));
//   }
// });

// socket.on('user-disconnected', (id) => {
//   if (peerConnections[id]) {
//     peerConnections[id].close();
//     delete peerConnections[id];
//   }
//   const box = document.getElementById('remote-box-' + id);
//   if (box) box.remove();
// });

// function startPeerConnection(id, isInitiator) {
//   if (peerConnections[id]) return;

//   const pc = new RTCPeerConnection(config);
//   peerConnections[id] = pc;

//   localStream.getTracks().forEach(track => {
//     pc.addTrack(track, localStream);
//   });

//   pc.ontrack = (event) => {
//     let remoteVideo = document.getElementById('remoteVideo-' + id);
//     if (!remoteVideo) return;
//     remoteVideo.srcObject = event.streams[0];
//     peerConnections[id].remoteStream = event.streams[0];
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit('ice-candidate', { to: id, candidate: event.candidate });
//     }
//   };

//   if (isInitiator) {
//     pc.createOffer()
//       .then(offer => pc.setLocalDescription(offer))
//       .then(() => {
//         socket.emit('offer', { to: id, offer: pc.localDescription });
//       });
//   }
// }


// sendBtn.addEventListener('click', sendMessage);
// messageInput.addEventListener('keydown', (e) => {
//   if (e.key === 'Enter') sendMessage();
// });

// function sendMessage() {
//   const text = messageInput.value.trim();
//   if (text === '') return;
//   socket.emit('chat-message', text);
//   messageInput.value = '';
// }

// socket.on('chat-message', ({ userNumber, message }) => {
//   const p = document.createElement('p');
//   p.innerHTML = `<strong>User ${userNumber}:</strong> ${message}`;
//   chatBox.appendChild(p);
//   chatBox.scrollTop = chatBox.scrollHeight;
// });

const socket = io("http://localhost:5000");

// Optional: test join without React
socket.emit("join", { name: "Test User", email: "test@example.com" });

socket.on("users", (users) => console.log("Users:", users));
socket.on("chat-message", (msg) => console.log("Message:", msg));
socket.on("force-mute", () => console.log("You are muted by host"));
