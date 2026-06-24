import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';

interface PlayerInfoProps {
  players: Player[];
  playerId: string;
  logs: string[];
  onSendChat: (text: string, targetPlayerId: string) => void;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  players,
  playerId,
  logs,
  onSendChat,
}) => {
  const [chatText, setChatText] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendChat(chatText, targetPlayerId);
    setChatText('');
  };

  const [filterPlayerId, setFilterPlayerId] = useState('');

  const filteredLogs = logs.filter(log => {
    if (!filterPlayerId) return true;
    const selectedPlayer = players.find(p => p.id === filterPlayerId);
    if (!selectedPlayer) return true;
    return log.toLowerCase().includes(selectedPlayer.name.toLowerCase());
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  return (
    <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ margin: 0 }}>Game Logs & Chat</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filter:</span>
          <select
            value={filterPlayerId}
            onChange={e => setFilterPlayerId(e.target.value)}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(195,155,84,0.3)',
              background: '#12141a',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <option value="">All Players</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        ref={chatEndRef}
        style={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '6px',
          padding: '10px',
          margin: '8px 0',
          fontSize: '12px',
        }}
      >
        {filteredLogs.map((log, i) => {
          let color = 'var(--text-main)';
          let fontWeight = 'normal';
          let fontStyle = 'normal';

          if (log.includes('[CHAT]')) {
            color = 'var(--text-gold)';
          } else if (log.includes('[WHISPER]')) {
            color = '#f472b6'; // Vibrant pink for private messages
            fontStyle = 'italic';
            fontWeight = 'bold';
          }

          return (
            <div key={i} style={{ margin: '4px 0', color, fontWeight, fontStyle }}>
              {log}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendChat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Send to:</span>
          <select
            value={targetPlayerId}
            onChange={e => setTargetPlayerId(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(195,155,84,0.3)',
              background: '#12141a',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <option value="">Everyone (Public)</option>
            {players
              .filter(p => p.id !== playerId && !p.isBot)
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.avatar === 'Bear' ? '🐻' : p.avatar === 'Eagle' ? '🦅' : p.avatar === 'Elephant' ? '🐘' : p.avatar === 'Gorilla' ? '🦍' : p.avatar === 'Lion' ? '🦁' : '🐋'} {p.name} (Private)
                </option>
              ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            placeholder={targetPlayerId ? "Type private message..." : "Type public chat..."}
            style={{
              flexGrow: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(195,155,84,0.3)',
              background: '#12141a',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <button type="submit" className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
