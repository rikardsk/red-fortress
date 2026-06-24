import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from './game/GameManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const manager = GameManager.getInstance();

// HTTP REST: Create Game Room
app.post('/api/create-room', (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  manager.createRoom(roomId);
  res.json({ roomId });
});

// HTTP REST: Join Game Check
app.post('/api/join-room', (req, res) => {
  const { roomId } = req.body;
  const room = manager.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  if (room.state.status !== 'LOBBY') {
    res.status(400).json({ error: 'Game already started' });
    return;
  }
  res.json({ success: true });
});

// WS Message Router
function routeMessage(ws: WebSocket, playerId: string, parsed: any): void {
  const room = manager.getRoom(parsed.roomId);
  if (!room) return;

  if (parsed.type === 'JOIN') {
    room.joinLobby(playerId, parsed.name, parsed.avatar);
    room.registerSocket(playerId, ws);
  } else if (parsed.type === 'JOIN_BOT') {
    room.joinLobby(parsed.botId, parsed.name, parsed.avatar, true);
  } else if (parsed.type === 'START_GAME') {
    room.startGame();
  } else if (parsed.type === 'RESTART_GAME') {
    room.restartGame();
  } else if (parsed.type === 'REMOVE_BOT') {
    room.removeBot(parsed.botId);
  } else if (parsed.type === 'ACTION') {
    room.handleAction(playerId, parsed.action);
  } else if (parsed.type === 'CHAT') {
    room.handleChat(playerId, parsed.playerName, parsed.text, parsed.targetPlayerId);
  }
}

// WS Connection Handler
wss.on('connection', (ws) => {
  let activePlayerId = '';
  let activeRoomId = '';

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.playerId) activePlayerId = parsed.playerId;
      if (parsed.roomId) activeRoomId = parsed.roomId;

      routeMessage(ws, activePlayerId, parsed);
    } catch (e) {
      console.error('Error handling websocket message:', e);
    }
  });

  ws.on('close', () => {
    if (activeRoomId && activePlayerId) {
      const room = manager.getRoom(activeRoomId);
      if (room) {
        room.removeSocket(activePlayerId);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
