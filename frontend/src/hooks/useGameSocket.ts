import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameAction } from '../types';

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize player id if not set
  useEffect(() => {
    let storedId = localStorage.getItem('red_fortress_player_id');
    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('red_fortress_player_id', storedId);
    }
    setPlayerId(storedId);
  }, []);

  // Connect websocket
  const connect = useCallback(() => {
    if (socketRef.current) socketRef.current.close();

    const ws = new WebSocket(`ws://localhost:4000`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'STATE_UPDATE') {
        setGameState(parsed.state);
      }
    };
  }, []);

  // Actions dispatcher helper
  const sendMessage = useCallback((msg: any) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  // Action methods
  const joinGame = useCallback((roomId: string, name: string, avatar: string) => {
    setPlayerName(name);
    connect();
    
    // Wait for connection to open then send JOIN
    const checkOpen = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'JOIN', roomId, playerId, name, avatar });
        clearInterval(checkOpen);
      }
    }, 100);
  }, [playerId, connect, sendMessage]);

  const joinBot = useCallback((roomId: string, name: string, avatar: string, botId: string) => {
    sendMessage({ type: 'JOIN_BOT', roomId, botId, name, avatar });
  }, [sendMessage]);

  const startGame = useCallback((roomId: string) => {
    sendMessage({ type: 'START_GAME', roomId });
  }, [sendMessage]);

  const restartGame = useCallback((roomId: string) => {
    sendMessage({ type: 'RESTART_GAME', roomId });
  }, [sendMessage]);

  const removeBot = useCallback((roomId: string, botId: string) => {
    sendMessage({ type: 'REMOVE_BOT', roomId, botId });
  }, [sendMessage]);

  const sendAction = useCallback((roomId: string, action: GameAction) => {
    sendMessage({ type: 'ACTION', roomId, action });
  }, [sendMessage]);

  const sendChat = useCallback((roomId: string, text: string, targetPlayerId?: string) => {
    sendMessage({ type: 'CHAT', roomId, playerName, text, targetPlayerId });
  }, [playerName, sendMessage]);

  return {
    gameState,
    playerId,
    playerName,
    joinGame,
    joinBot,
    startGame,
    restartGame,
    removeBot,
    sendAction,
    sendChat,
  };
}
