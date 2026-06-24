import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Markets } from './components/Markets';
import { PlayerInfo } from './components/PlayerInfo';
import { PlayerBar } from './components/PlayerBar';
import { Modal } from './components/Modal';
import { getLongestWall } from './utils/wallCalculator';
import { GameTimelinePanel } from './components/GameTimelinePanel';

export const App: React.FC = () => {
  const {
    gameState,
    playerId,
    joinGame,
    joinBot,
    startGame,
    restartGame,
    removeBot,
    sendAction,
    sendChat,
  } = useGameSocket();

  // Tracks which player's board is currently inspected in the grid
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedReserveTileId, setSelectedReserveTileId] = useState<string | null>(null);
  
  // Modal states
  const [activeModal, setActiveModal] = useState<'allCards' | 'allBuildings' | 'rules' | 'shortcuts' | 'settings' | 'gameMenu' | 'scores' | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // Panel toggles
  const [showBuildingMarket, setShowBuildingMarket] = useState(true);
  const [showMoneyMarket, setShowMoneyMarket] = useState(true);
  const [showPlayerSection, setShowPlayerSection] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [sidePanelWidth, setSidePanelWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);

  const [wallColor, setWallColor] = useState<string>(() => {
    return localStorage.getItem('rf_wall_color') || '#d946ef';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--wall-color', wallColor);
    localStorage.setItem('rf_wall_color', wallColor);
  }, [wallColor]);

  // Resize side panel drag handler
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - 30;
      if (newWidth > 250 && newWidth < window.innerWidth - 300) {
        setSidePanelWidth(newWidth);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const newWidth = window.innerWidth - clientX - 30;
      if (newWidth > 250 && newWidth < window.innerWidth - 300) {
        setSidePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (key === 'escape' || key === 'x') {
        setActiveModal(null);
      } else if (key === 'h') {
        setActiveModal(prev => prev === 'shortcuts' ? null : 'shortcuts');
      } else if (key === 'c') {
        setActiveModal(prev => prev === 'allCards' ? null : 'allCards');
      } else if (key === 'b') {
        setActiveModal(prev => prev === 'allBuildings' ? null : 'allBuildings');
      } else if (key === 'r') {
        setActiveModal(prev => prev === 'rules' ? null : 'rules');
      } else if (key === 's') {
        setActiveModal(prev => prev === 'settings' ? null : 'settings');
      } else if (key === 'm') {
        setActiveModal(prev => prev === 'gameMenu' ? null : 'gameMenu');
      } else if (key === 'v') {
        setActiveModal(prev => prev === 'scores' ? null : 'scores');
      } else if (key === 'g') {
        setShowGrid(prev => !prev);
      } else if (key === 't') {
        setShowTimeline(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-select own player when game starts
  useEffect(() => {
    if (gameState?.status === 'PLAYING' && !selectedPlayerId) {
      setSelectedPlayerId(playerId);
    }
  }, [gameState?.status, playerId, selectedPlayerId]);

  if (!gameState || gameState.status === 'LOBBY') {
    return (
      <Lobby
        gameState={gameState}
        playerId={playerId}
        joinGame={joinGame}
        joinBot={joinBot}
        startGame={startGame}
        removeBot={removeBot}
      />
    );
  }

  const me = gameState.players.find(p => p.id === playerId)!;
  const activePlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId)!;
  const inspectedPlayer = gameState.players.find(p => p.id === selectedPlayerId) || me;
  const isMyTurn = gameState.currentTurnPlayerId === playerId;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '15px', gap: '10px', overflow: 'hidden' }}>
      {/* Header Info */}
      <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Red Fortress</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-gold)' }}>Room Code: {gameState.roomId}</span>
        </div>
        
        {/* Navigation Toolbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Toggle buttons for layout panels */}
          <button
            className="btn-gold"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              opacity: showBuildingMarket ? 1 : 0.6,
              background: showBuildingMarket ? '' : 'rgba(0,0,0,0.4)',
              borderColor: showBuildingMarket ? '' : 'rgba(255,255,255,0.1)',
              color: showBuildingMarket ? '' : 'var(--text-muted)'
            }}
            onClick={() => setShowBuildingMarket(prev => !prev)}
          >
            🏗️ Building: {showBuildingMarket ? 'ON' : 'OFF'}
          </button>
          <button
            className="btn-gold"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              opacity: showMoneyMarket ? 1 : 0.6,
              background: showMoneyMarket ? '' : 'rgba(0,0,0,0.4)',
              borderColor: showMoneyMarket ? '' : 'rgba(255,255,255,0.1)',
              color: showMoneyMarket ? '' : 'var(--text-muted)'
            }}
            onClick={() => setShowMoneyMarket(prev => !prev)}
          >
            💰 Money: {showMoneyMarket ? 'ON' : 'OFF'}
          </button>
          <button
            className="btn-gold"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              opacity: showPlayerSection ? 1 : 0.6,
              background: showPlayerSection ? '' : 'rgba(0,0,0,0.4)',
              borderColor: showPlayerSection ? '' : 'rgba(255,255,255,0.1)',
              color: showPlayerSection ? '' : 'var(--text-muted)'
            }}
            onClick={() => setShowPlayerSection(prev => !prev)}
          >
            💬 Log & Chat: {showPlayerSection ? 'ON' : 'OFF'}
          </button>
          <button
            className="btn-gold"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              opacity: showTimeline ? 1 : 0.6,
              background: showTimeline ? '' : 'rgba(0,0,0,0.4)',
              borderColor: showTimeline ? '' : 'rgba(255,255,255,0.1)',
              color: showTimeline ? '' : 'var(--text-muted)'
            }}
            onClick={() => setShowTimeline(prev => !prev)}
          >
            ⏳ Timeline: {showTimeline ? 'ON' : 'OFF'}
          </button>

          <span style={{ borderLeft: '1px solid rgba(195,155,84,0.3)', margin: '0 5px' }}></span>

          <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveModal('rules')}>
            📖 Rules (R)
          </button>
          <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveModal('settings')}>
            ⚙️ Settings (S)
          </button>
          <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveModal('gameMenu')}>
            🛠️ Menu (M)
          </button>
          <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveModal('scores')}>
            🏆 Scores (V)
          </button>
          <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveModal('shortcuts')}>
            ⌨️ Shortcuts (H)
          </button>
        </div>

        <div style={{ textAlign: 'right' }}>
          {gameState.status === 'FINISHED' ? (
            <h2 style={{ color: '#10b981' }}>Winner: {gameState.players.find(p => p.id === gameState.winnerId)?.name}</h2>
          ) : (
            <h3>
              Turn: <span style={{ color: isMyTurn ? '#10b981' : 'var(--text-gold)' }}>{activePlayer.name}</span>{' '}
              ({gameState.actionsRemaining} actions left)
            </h3>
          )}
        </div>
      </div>

      {showTimeline && <GameTimelinePanel gameState={gameState} playerId={playerId} />}

      {/* Main Grid: Board & Side Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showPlayerSection ? `1fr auto ${sidePanelWidth}px` : '1fr',
        gridTemplateRows: '1fr',
        gap: showPlayerSection ? '0 10px' : '15px',
        flexGrow: 1,
        minHeight: 0
      }}>
        <GameBoard
          player={inspectedPlayer}
          activeTurn={isMyTurn}
          actionsRemaining={gameState.actionsRemaining}
          justBoughtTileId={isMyTurn ? gameState.justBoughtTileId : null}
          selectedReserveTileId={selectedReserveTileId}
          setSelectedReserveTileId={setSelectedReserveTileId}
          onPlaceTile={(tileId, x, y, fromReserve) => sendAction(gameState.roomId, { type: 'PLACE_TILE', tileId, x, y, fromReserve })}
          onReserveTile={(x, y) => sendAction(gameState.roomId, { type: 'RESERVE_TILE', x, y })}
          onSwapTile={(boardKey, reserveTileId) => sendAction(gameState.roomId, { type: 'SWAP_TILE', boardKey, reserveTileId })}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
        />

        {showPlayerSection && (
          <div
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: isDragging ? 'var(--border-gold)' : 'rgba(195, 155, 84, 0.15)',
              borderRadius: '4px',
              height: '100%',
              alignSelf: 'stretch',
              transition: 'background-color 0.2s',
              boxShadow: isDragging ? '0 0 10px var(--border-gold)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onTouchStart={() => {
              setIsDragging(true);
            }}
          >
            {/* Visual handle dots */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              opacity: isDragging ? 1 : 0.6
            }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-gold)' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-gold)' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-gold)' }} />
            </div>
          </div>
        )}

        {showPlayerSection && (
          <PlayerInfo
            players={gameState.players}
            playerId={playerId}
            logs={gameState.logs}
            onSendChat={(text, targetPlayerId) => sendChat(gameState.roomId, text, targetPlayerId)}
          />
        )}
      </div>

      {/* Markets Section */}
      {(showBuildingMarket || showMoneyMarket) && (
        <div style={{ position: 'relative' }}>
          {/* Toggle overlay trigger for All Cards */}
          {showMoneyMarket && (
            <button
              className="btn-gold"
              style={{ position: 'absolute', top: '-15px', right: '10px', padding: '4px 10px', fontSize: '10px', zIndex: 10 }}
              onClick={() => setActiveModal('allCards')}
            >
              🔍 Grid View (C)
            </button>
          )}
          <Markets
            market={gameState.market}
            playerHand={me.hand}
            activeTurn={isMyTurn}
            actionsRemaining={gameState.actionsRemaining}
            onTakeMoney={(cardIds) => sendAction(gameState.roomId, { type: 'TAKE_MONEY', playerHandBefore: me.hand.map(c => c.id), cardIds })}
            onBuyBuilding={(marketIndex, cardIds) => sendAction(gameState.roomId, { type: 'BUY_BUILDING', marketIndex, cardIds })}
            showBuildingMarket={showBuildingMarket}
            showMoneyMarket={showMoneyMarket}
            moneyDeckCount={gameState.moneyDeck?.length || 0}
            buildingBagCount={gameState.buildingBag?.length || 0}
            reserve={me.reserve}
            selectedReserveTileId={selectedReserveTileId}
            setSelectedReserveTileId={setSelectedReserveTileId}
            onOpenBuildingsGrid={() => setActiveModal('allBuildings')}
          />
        </div>
      )}

      {/* Player Navigation Bottom Bar */}
      <PlayerBar
        players={gameState.players}
        currentTurnPlayerId={gameState.currentTurnPlayerId}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
      />

      {/* Modal Declarations */}
      <Modal isOpen={activeModal === 'allCards'} title="All Hand Cards" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {me.hand.map(card => (
            <div key={card.id} className={`money-card ${card.currency}`} style={{ cursor: 'default' }}>
              <div className="money-card-currency">{card.currency}</div>
              <div className="money-card-value">{card.value}</div>
            </div>
          ))}
          {me.hand.length === 0 && <p className="text-muted">Your hand is empty.</p>}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'allBuildings'} title="Your Reserve Buildings" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {me.reserve.map(tile => (
            <div
              key={tile.id}
              onClick={() => {
                setSelectedReserveTileId(tile.id);
                setActiveModal(null);
              }}
              style={{
                width: '80px',
                height: '80px',
                cursor: 'pointer',
                border: '1px solid rgba(195,155,84,0.3)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              }}
              title="Click to select for placement"
            >
              <img src={`/images/buildings/${tile.type}.jpg`} alt={tile.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              <div className="building-tile-overlay" style={{ padding: '3px 6px', borderBottomRightRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tile.cost}</span>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.7)',
                textAlign: 'center',
                fontSize: '9px',
                padding: '2px 0',
                color: '#fff',
                fontWeight: 'bold',
              }}>
                {tile.type}
              </div>

              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderTop: tile.walls.north ? '4px solid var(--wall-color)' : '',
                borderRight: tile.walls.east ? '4px solid var(--wall-color)' : '',
                borderBottom: tile.walls.south ? '4px solid var(--wall-color)' : '',
                borderLeft: tile.walls.west ? '4px solid var(--wall-color)' : '',
                pointerEvents: 'none',
              }} />
            </div>
          ))}
          {me.reserve.length === 0 && <p className="text-muted">Your reserve shelf is empty.</p>}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'rules'} title="Rules of Red Fortress" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', lineHeight: '1.6' }}>
          <section>
            <h3>1. Currency & Building Markets</h3>
            <p>
              The market displays four building tiles, each associated with one of the four currencies:
              <strong> Denar (Blue)</strong>, <strong>Dirham (Green)</strong>, <strong>Ducats (Orange)</strong>, and <strong>Florins (Yellow)</strong>.
              To buy a building, you must pay with money cards matching the slot currency.
            </p>
          </section>
          <section>
            <h3>2. Exact Change Extra Action</h3>
            <p>
              If the sum of your chosen money cards equals the exact cost of the building, you get an
              <strong> immediate extra action</strong>! You can string multiple exact-change purchases together in a single turn.
            </p>
          </section>
          <section>
            <h3>3. Placement Rules</h3>
            <p>
              Buildings must connect back to your starting Central Fountain. Sides with walls (thick pink/purple lines)
              must face walls on adjacent tiles, and sides without walls must face sides without walls.
            </p>
          </section>
          <section>
            <h3>4. Redesign Actions</h3>
            <p>
              Instead of drafting money or buying, you can rearrange your fortress using one of three options:
              move a tile from your board to reserve, place a tile from reserve on the board, or swap a board tile with a reserve tile.
            </p>
          </section>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'shortcuts'} title="Keyboard Shortcuts" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px 20px', fontSize: '15px' }}>
          <strong>Key</strong><strong>Action</strong>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>H</span><span>Toggle Shortcuts Guide (Help)</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>X / Escape</span><span>Close Active Modal</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>C</span><span>Toggle Hand Cards Modal</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>B</span><span>Toggle Reserve Buildings Modal</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>R</span><span>Toggle Rules Guide</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>S</span><span>Toggle Settings Menu</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>M</span><span>Toggle Game Menu</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>V</span><span>Toggle Scoreboard Modal</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>G</span><span>Toggle Grid Visibility</span>
          <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>T</span><span>Toggle Game Timeline</span>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'settings'} title="Settings" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Sound Effects</span>
            <button className="btn-gold" style={{ padding: '6px 12px' }}>ON</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Default Grid System</span>
            <button className="btn-gold" style={{ padding: '6px 12px' }}>Visible</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Wall Color</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={wallColor}
                onChange={e => setWallColor(e.target.value)}
                style={{
                  padding: '1px 2px',
                  borderRadius: '4px',
                  border: '1px solid rgba(195,155,84,0.3)',
                  background: '#12141a',
                  cursor: 'pointer',
                  width: '32px',
                  height: '24px',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {wallColor.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>Ambience volume</span>
            <input type="range" min="0" max="100" defaultValue="50" style={{ accentColor: 'var(--border-gold)' }} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'gameMenu'} title="Game Menu" onClose={() => setActiveModal(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>Room Code: {gameState.roomId}</h3>
          {gameState.players[0]?.id === playerId ? (
            <>
              <p style={{ color: '#10b981' }}>You are the Game Creator.</p>
              <button className="btn-gold" onClick={() => { restartGame(gameState.roomId); setActiveModal(null); }} style={{ backgroundColor: 'var(--color-florin)' }}>
                Restart Game (Back to Lobby)
              </button>
              <div style={{ borderTop: '1px solid rgba(195,155,84,0.2)', paddingTop: '15px' }}>
                <h4>Remove Active Bot Players:</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {gameState.players.filter(p => p.isBot).map(bot => (
                    <button key={bot.id} className="btn-gold" onClick={() => removeBot(gameState.roomId, bot.id)} style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '12px', padding: '6px 12px' }}>
                      Remove {bot.name}
                    </button>
                  ))}
                  {gameState.players.filter(p => p.isBot).length === 0 && (
                    <p className="text-muted" style={{ fontSize: '12px' }}>No active bots to remove.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted">Only the creator can restart the game or remove players.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'scores'} title="Scoreboard" onClose={() => setActiveModal(null)}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(195,155,84,0.3)', color: 'var(--text-gold)' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Score</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Longest Wall</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Current Wall</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Buildings</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Reserve</th>
            </tr>
          </thead>
          <tbody>
            {[...gameState.players]
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => {
                const rankText = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}th`;
                const isMe = player.id === playerId;
                return (
                  <tr 
                    key={player.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(195,155,84,0.1)',
                      backgroundColor: isMe ? 'rgba(195,155,84,0.15)' : 'transparent',
                      fontWeight: isMe ? 'bold' : 'normal'
                    }}
                  >
                    <td style={{ padding: '10px', fontSize: '16px' }}>{rankText}</td>
                    <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{player.avatar === 'Bear' ? '🐻' : player.avatar === 'Eagle' ? '🦅' : player.avatar === 'Elephant' ? '🐘' : player.avatar === 'Gorilla' ? '🦍' : player.avatar === 'Lion' ? '🦁' : '🐋'}</span>
                      <span>{player.name} {isMe && '(You)'}</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-gold)', fontSize: '18px', fontWeight: 'bold' }}>{player.score}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{player.longestWall}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{getLongestWall(player.board)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{Object.keys(player.board).length - 1}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{player.reserve.length}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

export default App;
