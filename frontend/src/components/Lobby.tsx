import React, { useState } from 'react';
import { GameState } from '../types';

interface LobbyProps {
  gameState: GameState | null;
  playerId: string;
  joinGame: (roomId: string, name: string, avatar: string) => void;
  joinBot: (roomId: string, name: string, avatar: string, botId: string) => void;
  startGame: (roomId: string) => void;
  removeBot: (roomId: string, botId: string) => void;
}

const AVATARS = ['Bear', 'Eagle', 'Elephant', 'Gorilla', 'Lion', 'Orca'];

export const Lobby: React.FC<LobbyProps> = ({
  gameState,
  playerId,
  joinGame,
  joinBot,
  startGame,
  removeBot,
}) => {
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [avatar, setAvatar] = useState('Bear');
  const [error, setError] = useState('');

  // Call backend to create room
  const handleCreateRoom = async () => {
    if (!name.trim()) return setError('Enter a nickname first');
    try {
      const res = await fetch('http://localhost:4000/api/create-room', { method: 'POST' });
      const data = await res.json();
      joinGame(data.roomId, name, avatar);
    } catch (e) {
      setError('Could not connect to game server');
    }
  };

  // Join existing room
  const handleJoinRoom = async () => {
    if (!name.trim()) return setError('Enter a nickname first');
    if (!roomIdInput.trim()) return setError('Enter a Room Code');
    try {
      const res = await fetch('http://localhost:4000/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomIdInput.toUpperCase() }),
      });
      if (!res.ok) return setError('Room not found or already playing');
      joinGame(roomIdInput.toUpperCase(), name, avatar);
    } catch (e) {
      setError('Could not connect to game server');
    }
  };

  // Add a bot player to lobby
  const handleAddBot = () => {
    if (!gameState) return;
    const available = AVATARS.filter(av => !gameState.players.some(p => p.avatar === av));
    if (available.length === 0) return;
    const botAvatar = available[0];
    const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
    joinBot(gameState.roomId, `Bot ${botAvatar}`, botAvatar, botId);
  };

  if (gameState) {
    return (
      <div className="lobby-container">
        <div className="glass-panel-gold lobby-box">
          <h2>Room: {gameState.roomId}</h2>
          <p className="text-muted">Wait for 3-6 players to join. You can add AI bots below.</p>
          
          <div style={{ margin: '15px 0' }}>
            <h3>Players Joined ({gameState.players.length}/6):</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '10px' }}>
              {gameState.players.map(p => (
                <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' }}>
                  <img src={`/images/icons/${p.avatar}.png`} alt={p.avatar} style={{ width: '28px', height: '28px' }} />
                  <strong>{p.name}</strong> {p.isBot ? '(AI)' : ''} {p.id === playerId ? '(You)' : ''}
                  {p.isBot && gameState.players[0]?.id === playerId && (
                    <button
                      onClick={() => removeBot(gameState.roomId, p.id)}
                      style={{
                        marginLeft: 'auto',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      title={`Remove ${p.name}`}
                    >
                      ❌ Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn-gold" onClick={handleAddBot} disabled={gameState.players.length >= 6}>
              Add AI Bot
            </button>
            {gameState.players[0]?.id === playerId && (
              <button
                className="btn-gold"
                onClick={() => startGame(gameState.roomId)}
                disabled={gameState.players.length < 3}
                style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '1px solid #a7f3d0' }}
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="glass-panel-gold lobby-box">
        <h1 style={{ textAlign: 'center', fontFamily: 'var(--font-title)' }}>RED FORTRESS</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-gold)' }}>Alhambra-Style Board Game</p>
        
        {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>Your Nickname:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. King Arthur"
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-gold)', background: '#12141a', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>Select Animal Avatar:</label>
          <div className="avatar-selector">
            {AVATARS.map(av => (
              <button
                key={av}
                className={`avatar-choice ${avatar === av ? 'selected' : ''}`}
                onClick={() => setAvatar(av)}
              >
                <img src={`/images/icons/${av}.png`} alt={av} className="avatar-choice-img" />
                <span className="avatar-choice-name">{av}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
          <button className="btn-gold" onClick={handleCreateRoom}>
            Create Game
          </button>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              value={roomIdInput}
              onChange={e => setRoomIdInput(e.target.value)}
              placeholder="Room Code"
              style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-gold)', background: '#12141a', color: '#fff', textTransform: 'uppercase' }}
            />
            <button className="btn-gold" onClick={handleJoinRoom} style={{ flexGrow: 1 }}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
