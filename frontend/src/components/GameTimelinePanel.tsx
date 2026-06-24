import React from 'react';
import { Player, GameState } from '../types';

interface GameTimelinePanelProps {
  gameState: GameState;
  playerId: string;
}

const AVATAR_COLORS: Record<string, string> = {
  Bear: '#b55d22',      // Warm Brown
  Eagle: '#0ea5e9',     // Sky Blue
  Elephant: '#64748b',  // Slate Grey
  Gorilla: '#334155',   // Dark Grey
  Lion: '#ca8a04',      // Golden Yellow
  Orca: '#4f46e5',      // Indigo Blue
};

const AVATAR_EMOJIS: Record<string, string> = {
  Bear: '🐻',
  Eagle: '🦅',
  Elephant: '🐘',
  Gorilla: '🦍',
  Lion: '🦁',
  Orca: '🐋',
};

export const GameTimelinePanel: React.FC<GameTimelinePanelProps> = ({ gameState, playerId }) => {
  const { players, moneyDeck, logs } = gameState;

  // ================= SCORE TRACK CALCULATIONS =================
  const maxPlayerScore = Math.max(...players.map(p => p.score), 0);
  const trackMax = Math.max(100, Math.ceil((maxPlayerScore + 10) / 10) * 10);

  // Group players by score to handle overlaps elegantly
  const playersByScore: Record<number, Player[]> = {};
  players.forEach(p => {
    if (!playersByScore[p.score]) {
      playersByScore[p.score] = [];
    }
    playersByScore[p.score].push(p);
  });

  // Ticks at every 10 points
  const ticks = [];
  for (let i = 0; i <= trackMax; i += 10) {
    ticks.push(i);
  }

  // ================= DECK TIMELINE CALCULATIONS =================
  // Money deck total cards is 108 regular + 2 scoring = 110 cards
  const totalDeckSize = 110;
  const currentDeckSize = moneyDeck.length;
  const cardsDrawn = Math.max(0, totalDeckSize - currentDeckSize);
  const drawPercentage = Math.min(100, (cardsDrawn / totalDeckSize) * 100);

  // Approximate thresholds for scoring events (setup inserts in 2nd and 3rd parts of the deck)
  // Part 1: 0 to 36 cards
  // Part 2: 37 to 73 cards (contains SCORING_1)
  // Part 3: 74 to 110 cards (contains SCORING_2)
  const scoring1Percent = (36 + 18) / totalDeckSize * 100; // ~49%
  const scoring2Percent = (73 + 18) / totalDeckSize * 100; // ~82%

  // ================= TURN LOG TIMELINE PARSING =================
  interface ParsedEvent {
    key: string;
    type: 'player' | 'scoring' | 'system';
    avatar?: string;
    playerName?: string;
    actionText: string;
    color?: string;
  }

  const parsedEvents: ParsedEvent[] = [];
  // Parse logs in chronological order (or reverse, we want sequence of recent events)
  const logLimit = 30;
  const recentLogs = logs.slice(-logLimit);

  recentLogs.forEach((log, index) => {
    // Check for scoring round triggers
    if (log.includes('Scoring Round')) {
      const match = log.match(/Scoring Round (\d+)/i);
      const roundNum = match ? match[1] : '1';
      parsedEvents.push({
        key: `scoring-${index}`,
        type: 'scoring',
        avatar: '🏆',
        actionText: `Scoring ${roundNum}`,
        color: 'var(--text-gold)',
      });
      return;
    }

    if (log.includes('Game started')) {
      parsedEvents.push({
        key: `start-${index}`,
        type: 'system',
        avatar: '⚔️',
        actionText: 'Start',
        color: '#10b981',
      });
      return;
    }

    // Check if it's a player action
    const player = players.find(p => log.startsWith(p.name));
    if (player) {
      let actionText = '';
      if (log.includes('placed')) {
        const match = log.match(/placed (\w+)/i);
        actionText = `Placed ${match ? match[1] : 'Tile'}`;
      } else if (log.includes('bought')) {
        const match = log.match(/bought (\w+)/i);
        actionText = `Bought ${match ? match[1] : 'Tile'}`;
      } else if (log.includes('drafted')) {
        const match = log.match(/drafted (\d+)/i);
        actionText = `Drafted ${match ? match[1] : ''} Money`;
      } else if (log.includes('moved')) {
        actionText = 'Reserved';
      } else if (log.includes('swapped')) {
        actionText = 'Swapped';
      }

      if (actionText) {
        parsedEvents.push({
          key: `action-${index}`,
          type: 'player',
          avatar: player.avatar,
          playerName: player.name,
          actionText,
          color: AVATAR_COLORS[player.avatar],
        });
      }
    }
  });

  // Keep the last 6 parsed events to display in the compact timeline
  const displayedEvents = parsedEvents.slice(-6);

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '10px 20px', 
        display: 'grid', 
        gridTemplateColumns: '1.8fr 1fr 1.2fr', 
        gap: '20px', 
        alignItems: 'center', 
        fontSize: '13px',
        border: '1px solid rgba(195, 155, 84, 0.25)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        minHeight: '75px',
        maxHeight: '90px'
      }}
    >
      {/* 1. SCORE TRACK (POINT TIMELINE) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-gold)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            🏰 SCORE TRACK
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Max: {trackMax} pts
          </span>
        </div>

        <div 
          style={{ 
            height: '24px', 
            background: 'rgba(0,0,0,0.4)', 
            border: '1px solid rgba(195,155,84,0.15)',
            borderRadius: '6px',
            position: 'relative',
            margin: '4px 0 12px 0',
          }}
        >
          {/* Tick lines and labels */}
          {ticks.map(tick => {
            const percent = (tick / trackMax) * 100;
            return (
              <React.Fragment key={tick}>
                <div 
                  style={{
                    position: 'absolute',
                    left: `${percent}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: tick % 50 === 0 ? 'rgba(195,155,84,0.4)' : 'rgba(195,155,84,0.15)',
                    zIndex: 1
                  }}
                />
                <span 
                  style={{
                    position: 'absolute',
                    left: `${percent}%`,
                    top: '24px',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: tick % 50 === 0 ? 'var(--text-gold)' : 'var(--text-muted)',
                    fontWeight: tick % 50 === 0 ? 'bold' : 'normal',
                    marginTop: '2px',
                    zIndex: 1
                  }}
                >
                  {tick}
                </span>
              </React.Fragment>
            );
          })}

          {/* Player Chips */}
          {players.map(p => {
            const playersAtScore = playersByScore[p.score] || [];
            const indexInGroup = playersAtScore.findIndex(x => x.id === p.id);
            const percent = (p.score / trackMax) * 100;
            const avatarColor = AVATAR_COLORS[p.avatar] || '#c39b54';
            const isMe = p.id === playerId;

            // Offset overlapping chips vertically to keep them readable
            const verticalOffset = indexInGroup * 5;

            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `calc(${percent}% - 9px)`,
                  top: `calc(3px - ${verticalOffset}px)`,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: avatarColor,
                  border: isMe ? '2px solid #fff' : '1px solid rgba(255,255,255,0.7)',
                  boxShadow: isMe ? '0 0 6px #fff' : '0 2px 4px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  zIndex: isMe ? 10 : 5 - indexInGroup,
                  cursor: 'pointer',
                  transition: 'left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                title={`${p.name}: ${p.score} points`}
              >
                {AVATAR_EMOJIS[p.avatar] || '👤'}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DECK PROGRESSION TIMELINE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-gold)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            🎴 DECK TIMELINE
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {currentDeckSize} cards left
          </span>
        </div>

        <div 
          style={{ 
            height: '12px', 
            background: '#12141a', 
            border: '1px solid rgba(195,155,84,0.2)',
            borderRadius: '6px',
            position: 'relative',
            marginTop: '10px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)'
          }}
        >
          {/* Filled Progress */}
          <div 
            style={{
              width: `${drawPercentage}%`,
              height: '100%',
              borderRadius: '5px',
              background: 'linear-gradient(90deg, rgba(195,155,84,0.3) 0%, rgba(195,155,84,0.7) 100%)',
              transition: 'width 0.5s ease-out'
            }}
          />

          {/* Scoring Event Markers */}
          {/* 1st Scoring Event Marker */}
          <div 
            style={{
              position: 'absolute',
              left: `${scoring1Percent}%`,
              top: '-12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 3
            }}
            title="1st Scoring Round (approximate)"
          >
            <span style={{ fontSize: '8px', color: gameState.scoringRound >= 1 ? '#10b981' : 'var(--text-gold)', fontWeight: 'bold' }}>1st</span>
            <div style={{ width: '2px', height: '16px', backgroundColor: gameState.scoringRound >= 1 ? '#10b981' : 'var(--border-gold)', marginTop: '2px' }} />
          </div>

          {/* 2nd Scoring Event Marker */}
          <div 
            style={{
              position: 'absolute',
              left: `${scoring2Percent}%`,
              top: '-12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 3
            }}
            title="2nd Scoring Round (approximate)"
          >
            <span style={{ fontSize: '8px', color: gameState.scoringRound >= 2 ? '#10b981' : 'var(--text-gold)', fontWeight: 'bold' }}>2nd</span>
            <div style={{ width: '2px', height: '16px', backgroundColor: gameState.scoringRound >= 2 ? '#10b981' : 'var(--border-gold)', marginTop: '2px' }} />
          </div>

          {/* Final Scoring Event Marker */}
          <div 
            style={{
              position: 'absolute',
              left: '100%',
              top: '-12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)',
              zIndex: 3
            }}
            title="Final Scoring Round"
          >
            <span style={{ fontSize: '8px', color: gameState.status === 'FINISHED' ? '#10b981' : 'var(--text-gold)', fontWeight: 'bold' }}>End</span>
            <div style={{ width: '2px', height: '16px', backgroundColor: gameState.status === 'FINISHED' ? '#10b981' : 'var(--border-gold)', marginTop: '2px' }} />
          </div>

          {/* Current Progress Pointer */}
          <div 
            style={{
              position: 'absolute',
              left: `${drawPercentage}%`,
              top: '-4px',
              width: '6px',
              height: '18px',
              backgroundColor: '#fff',
              borderRadius: '2px',
              boxShadow: '0 0 6px rgba(255,255,255,0.8)',
              transform: 'translateX(-50%)',
              zIndex: 4,
              transition: 'left 0.5s ease-out'
            }}
          />
        </div>
      </div>

      {/* 3. EVENT/TURN TIMELINE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', overflow: 'hidden' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-gold)', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '2px' }}>
          ⏳ GAME TIMELINE
        </span>

        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.05)',
            overflowX: 'hidden',
            width: '100%',
            height: '34px',
            position: 'relative'
          }}
        >
          {displayedEvents.map((evt, idx) => (
            <React.Fragment key={evt.key}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  border: `1px solid ${evt.color || 'rgba(195,155,84,0.3)'}`,
                  fontSize: '9px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '11px' }}>
                  {evt.type === 'player' ? (AVATAR_EMOJIS[evt.avatar || ''] || '👤') : (evt.avatar || '⭐')}
                </span>
                <span style={{ fontWeight: 'bold', color: evt.color || 'inherit' }}>
                  {evt.actionText}
                </span>
              </div>
              {idx < displayedEvents.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          ))}
          {displayedEvents.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>
              Waiting for actions...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
