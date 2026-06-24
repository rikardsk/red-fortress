import React, { useState, useEffect } from 'react';
import { Player, BuildingTile } from '../types';

interface GameBoardProps {
  player: Player;
  activeTurn: boolean;
  actionsRemaining: number;
  justBoughtTileId: string | null;
  selectedReserveTileId: string | null;
  setSelectedReserveTileId: (id: string | null) => void;
  onPlaceTile: (tileId: string, x: number, y: number, fromReserve: boolean) => void;
  onReserveTile: (x: number, y: number) => void;
  onSwapTile: (boardKey: string, reserveTileId: string) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

// Check if a tile can be validly placed at coordinates (simulated client-side check for highlighting)
function checkPlacementValidity(board: Record<string, BuildingTile>, tile: BuildingTile, tx: number, ty: number): boolean {
  // basic checks: not fountain, empty cell, adjacent to something
  if (board[`${tx},${ty}`] !== undefined) return false;
  const neighbors = [`${tx},${ty+1}`, `${tx},${ty-1}`, `${tx+1},${ty}`, `${tx-1},${ty}`];
  if (!neighbors.some(n => board[n] !== undefined)) return false;

  // check wall alignments
  const n = board[`${tx},${ty+1}`];
  const s = board[`${tx},${ty-1}`];
  const e = board[`${tx+1},${ty}`];
  const w = board[`${tx-1},${ty}`];

  if (n && tile.walls.north !== n.walls.south) return false;
  if (s && tile.walls.south !== s.walls.north) return false;
  if (e && tile.walls.east !== e.walls.west) return false;
  if (w && tile.walls.west !== w.walls.east) return false;

  return true;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  player,
  activeTurn,
  actionsRemaining,
  justBoughtTileId,
  selectedReserveTileId,
  setSelectedReserveTileId,
  onPlaceTile,
  onReserveTile,
  onSwapTile,
  showGrid,
  setShowGrid,
}) => {
  const [selectedBoardKey, setSelectedBoardKey] = useState<string | null>(null);

  const centerOnFountain = () => {
    const container = document.getElementById('board-scroll-container');
    if (container) {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  };

  // Center board scroll on Fountain
  useEffect(() => {
    centerOnFountain();
  }, []);

  const getActiveTileToPlace = (): BuildingTile | null => {
    if (selectedReserveTileId) {
      return player.reserve.find(t => t.id === selectedReserveTileId) || null;
    }
    if (justBoughtTileId) {
      return player.reserve.find(t => t.id === justBoughtTileId) || null;
    }
    return null;
  };

  const handleCellClick = (gx: number, gy: number) => {
    const activeTile = getActiveTileToPlace();
    if (!activeTile || !activeTurn) return;

    const fromReserve = activeTile.id === selectedReserveTileId;
    onPlaceTile(activeTile.id, gx, gy, fromReserve);
    setSelectedReserveTileId(null);
  };

  const handleTileClick = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (key === '0,0') return; // Starting Fountain cannot be reserved or swapped
    if (!activeTurn || actionsRemaining <= 0) return;

    if (selectedReserveTileId) {
      onSwapTile(key, selectedReserveTileId);
      setSelectedReserveTileId(null);
    } else {
      setSelectedBoardKey(selectedBoardKey === key ? null : key);
    }
  };

  const renderCells = () => {
    const cells: React.ReactNode[] = [];
    const activeTile = getActiveTileToPlace();

    // Generate grid from x=-10 to 10 and y=10 to -10 (centered on 0,0)
    for (let gy = 10; gy >= -10; gy--) {
      for (let gx = -10; gx <= 10; gx++) {
        const key = `${gx},${gy}`;
        const tile = player.board[key];
        const isValid = activeTile ? checkPlacementValidity(player.board, activeTile, gx, gy) : false;

        cells.push(
          <div
            key={key}
            className={`grid-cell ${tile ? '' : 'empty'} ${showGrid ? 'show-grid' : ''} ${isValid ? 'valid-place' : ''}`}
            onClick={() => isValid && handleCellClick(gx, gy)}
            style={{ position: 'relative' }}
          >
            {tile && renderTileItem(tile, key)}
            {selectedBoardKey === key && (
              <div
                style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '-1px',
                  right: '-1px',
                  bottom: '-1px',
                  border: '3px solid red',
                  boxShadow: '0 0 8px red',
                  zIndex: 20,
                  pointerEvents: 'none',
                  borderRadius: '4px',
                }}
              />
            )}
          </div>
        );
      }
    }
    return cells;
  };

  const renderTileItem = (tile: BuildingTile, key: string) => {
    const wallClasses = [
      tile.walls.north ? 'wall-north' : '',
      tile.walls.east ? 'wall-east' : '',
      tile.walls.south ? 'wall-south' : '',
      tile.walls.west ? 'wall-west' : '',
    ].join(' ');

    return (
      <div
        className={`building-tile-container ${wallClasses}`}
        onClick={(e) => handleTileClick(key, e)}
        style={{ cursor: activeTurn && key !== '0,0' ? 'pointer' : 'default' }}
      >
        <img src={`/images/buildings/${tile.type}.jpg`} alt={tile.type} className="building-tile-img" />
        <div className="building-tile-overlay">
          {tile.cost > 0 && <div className="building-tile-cost">{tile.cost}</div>}
          <div className="building-tile-name">{tile.type}</div>
        </div>
      </div>
    );
  };

  const handleReserveAction = () => {
    if (!selectedBoardKey) return;
    const [bx, by] = selectedBoardKey.split(',').map(Number);
    onReserveTile(bx, by);
    setSelectedBoardKey(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '15px', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>Board: {player.name} ({player.avatar})</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-gold" onClick={centerOnFountain} style={{ padding: '4px 10px', fontSize: '11px' }}>
            ⛲ Center Fountain
          </button>
          <button className="btn-gold" onClick={() => setShowGrid(!showGrid)} style={{ padding: '4px 10px', fontSize: '11px' }}>
            Grid: {showGrid ? 'ON' : 'OFF'}
          </button>
          
          {selectedBoardKey && (
            <button className="btn-gold" onClick={handleReserveAction} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--color-ducat)' }}>
              Move to Reserve
            </button>
          )}
        </div>
      </div>

      <div
        id="board-scroll-container"
        style={{
          width: '100%',
          flexGrow: 1,
          minHeight: 0,
          overflow: 'auto',
          border: '1px solid rgba(195,155,84,0.2)',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.6)',
        }}
      >
        <div className="game-grid">
          {renderCells()}
        </div>
      </div>
    </div>
  );
};
