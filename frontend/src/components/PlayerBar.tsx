import React from 'react';
import { Player } from '../types';

interface PlayerBarProps {
  players: Player[];
  currentTurnPlayerId: string;
  selectedPlayerId: string;
  setSelectedPlayerId: (id: string) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  players,
  currentTurnPlayerId,
  selectedPlayerId,
  setSelectedPlayerId,
}) => {
  return (
    <div className="glass-panel" style={{ marginTop: '15px' }}>
      <div className="player-bar-container">
        {players.map(player => {
          const isTurn = currentTurnPlayerId === player.id;
          const isSelected = selectedPlayerId === player.id;
          
          return (
            <button
              key={player.id}
              className={`player-avatar-btn ${isTurn ? 'active-turn' : ''}`}
              onClick={() => setSelectedPlayerId(player.id)}
              style={{
                borderWidth: isSelected ? '3px' : '1px',
                borderColor: isSelected ? 'var(--border-gold)' : isTurn ? '#10b981' : 'rgba(195,155,84,0.3)',
                transform: isSelected ? 'scale(1.08)' : '',
              }}
            >
              <img
                src={`/images/icons/${player.avatar}.png`}
                alt={player.avatar}
                className="player-avatar-img"
              />
              
              <div className="player-avatar-badge">
                {player.name}
              </div>

              {/* Status information bubbles */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                  color: '#fff',
                }}
                title="Cards in hand"
              >
                {player.hand.length}
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  background: 'var(--border-gold)',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                  color: '#000',
                }}
                title="Current Score"
              >
                {player.score}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
