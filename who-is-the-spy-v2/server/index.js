
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', ({ roomCode, player }) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) rooms[roomCode] = [];
    rooms[roomCode].push({ id: socket.id, ...player });
    io.to(roomCode).emit('room-update', rooms[roomCode]);
  });

  socket.on('start-game', ({ roomCode, word, spyIndex }) => {
    io.to(roomCode).emit('game-started', { word, spyIndex });
  });

  socket.on('cast-vote', ({ roomCode, voterId, votedId }) => {
    io.to(roomCode).emit('vote-cast', { voterId, votedId });
  });

  socket.on('disconnect', () => {
    for (const [roomCode, players] of Object.entries(rooms)) {
      rooms[roomCode] = players.filter(p => p.id !== socket.id);
      io.to(roomCode).emit('room-update', rooms[roomCode]);
    }
  });
});

app.use(cors());
app.get('/', (req, res) => res.send('Who is the Spy Server Running'));

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
