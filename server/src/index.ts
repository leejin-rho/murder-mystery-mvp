import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ScenarioLoader } from './scenarioLoader';
import { GameManager } from './gameManager';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST']
}));

app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Load scenarios
const scenarioLoader = new ScenarioLoader();
const gameManager = new GameManager(io, scenarioLoader);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('room:create', ({ playerName }) => {
    gameManager.createRoom(socket, playerName);
  });

  socket.on('room:join', ({ roomId, playerName }) => {
    gameManager.joinRoom(socket, roomId, playerName);
  });

  socket.on('game:start', ({ roomId }) => {
    gameManager.startGame(roomId);
  });

  socket.on('game:pick', ({ roomId, playerId, choiceId }) => {
    gameManager.handlePlayerPick(socket, roomId, playerId, choiceId);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`\n🎮 Murder Mystery Server is running!`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
