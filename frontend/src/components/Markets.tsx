import React, { useState } from 'react';
import { GameMarket, MoneyCard, BuildingTile, Currency } from '../types';

interface MarketsProps {
  market: GameMarket;
  playerHand: MoneyCard[];
  activeTurn: boolean;
  actionsRemaining: number;
  onTakeMoney: (cardIds: string[]) => void;
  onBuyBuilding: (marketIndex: number, cardIds: string[]) => void;
  showBuildingMarket: boolean;
  showMoneyMarket: boolean;
  moneyDeckCount: number;
  buildingBagCount: number;
  reserve: BuildingTile[];
  selectedReserveTileId: string | null;
  setSelectedReserveTileId: (id: string | null) => void;
  onOpenBuildingsGrid: () => void;
}

const SLOT_CURRENCIES: Currency[] = ['Denar', 'Dirham', 'Ducats', 'Florins'];
const CURRENCY_COLORS: Record<Currency, string> = {
  Denar: 'var(--color-denar)',
  Dirham: 'var(--color-dirham)',
  Ducats: 'var(--color-ducat)',
  Florins: 'var(--color-florin)',
};

export const Markets: React.FC<MarketsProps> = ({
  market,
  playerHand,
  activeTurn,
  actionsRemaining,
  onTakeMoney,
  onBuyBuilding,
  showBuildingMarket,
  showMoneyMarket,
  moneyDeckCount,
  buildingBagCount,
  reserve,
  selectedReserveTileId,
  setSelectedReserveTileId,
  onOpenBuildingsGrid,
}) => {
  const [selectedMarketCards, setSelectedMarketCards] = useState<string[]>([]);
  const [selectedHandCards, setSelectedHandCards] = useState<string[]>([]);

  const handleReserveTileClick = (tileId: string) => {
    if (!activeTurn || actionsRemaining <= 0) return;
    setSelectedReserveTileId(selectedReserveTileId === tileId ? null : tileId);
  };

  // Toggle selection of market money card
  const toggleMarketCard = (cardId: string) => {
    setSelectedMarketCards(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
      
      const clickedCard = market.money.find(c => c.id === cardId);
      if (!clickedCard) return prev;

      // If clicked card is 5 or more, deselect all other cards and select this one
      if (clickedCard.value >= 5) {
        return [cardId];
      }

      // If any currently selected card is 5 or more, deselect it/them and select the clicked card
      const hasFiveOrMoreSelected = market.money.some(c => prev.includes(c.id) && c.value >= 5);
      if (hasFiveOrMoreSelected) {
        return [cardId];
      }

      const newSelection = [...prev, cardId];
      // Validate sum rule: <= 5 if multiple
      const cards = market.money.filter(c => newSelection.includes(c.id));
      const total = cards.reduce((sum, c) => sum + c.value, 0);
      if (cards.length > 1 && total > 5) return prev; // reject if exceeds 5
      return newSelection;
    });
  };

  // Toggle selection of hand money card
  const toggleHandCard = (cardId: string) => {
    setSelectedHandCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }

      const clickedCard = playerHand.find(c => c.id === cardId);
      if (!clickedCard) return prev;

      const selectedCards = playerHand.filter(c => prev.includes(c.id));
      if (selectedCards.length > 0) {
        const firstSelectedCard = selectedCards[0];
        if (firstSelectedCard.currency !== clickedCard.currency) {
          return [cardId];
        }
      }

      return [...prev, cardId];
    });
  };

  const handleTakeMoneyClick = () => {
    if (selectedMarketCards.length === 0) return;
    onTakeMoney(selectedMarketCards);
    setSelectedMarketCards([]);
  };

  const handleBuyClick = (index: number, tile: BuildingTile) => {
    const currency = SLOT_CURRENCIES[index];
    const handCards = playerHand.filter(c => selectedHandCards.includes(c.id));
    if (handCards.some(c => c.currency !== currency)) return;

    const total = handCards.reduce((sum, c) => sum + c.value, 0);
    if (total < tile.cost) return;

    onBuyBuilding(index, selectedHandCards);
    setSelectedHandCards([]);
  };

  const canBuyBuilding = (index: number, tile: BuildingTile | null): boolean => {
    if (!tile) return false;
    if (!activeTurn || actionsRemaining <= 0) return false;
    if (selectedHandCards.length === 0) return false;

    const currency = SLOT_CURRENCIES[index];
    const handCards = playerHand.filter(c => selectedHandCards.includes(c.id));
    if (handCards.some(c => c.currency !== currency)) return false;

    const total = handCards.reduce((sum, c) => sum + c.value, 0);
    return total >= tile.cost;
  };

  if (!showBuildingMarket && !showMoneyMarket) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showBuildingMarket && showMoneyMarket ? '1.2fr 1fr' : '1fr', gap: '20px', margin: '15px 0' }}>
      {/* Building Market */}
      {showBuildingMarket && (
        <div className="glass-panel" style={{ padding: '15px' }}>
          <h3>Building Market <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-gold)', marginLeft: '8px' }}>({buildingBagCount} tiles left)</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
            {market.buildings.map((tile, i) => {
              const currency = SLOT_CURRENCIES[i];
              const color = CURRENCY_COLORS[currency];
              const isSelectedHand = selectedHandCards.length > 0;
              const canBuy = canBuyBuilding(i, tile);

              let opacity = 1;
              let boxShadow = '';
              let border = '1px solid rgba(195,155,84,0.15)';

              if (tile && isSelectedHand) {
                if (canBuy) {
                  boxShadow = '0 0 12px rgba(195,155,84,0.7)';
                  border = '1px solid var(--border-gold)';
                } else {
                  opacity = 0.4;
                }
              }

              return (
                <div
                  key={i}
                  className="glass-panel"
                  style={{
                    padding: '8px',
                    borderTop: `4px solid ${color}`,
                    borderLeft: border,
                    borderRight: border,
                    borderBottom: border,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    opacity,
                    boxShadow,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <span style={{ fontSize: '10px', color: color, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {currency}
                  </span>
                  
                  {tile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div
                        className={`building-tile-container ${
                          tile.walls.north ? 'wall-north' : ''
                        } ${
                          tile.walls.east ? 'wall-east' : ''
                        } ${
                          tile.walls.south ? 'wall-south' : ''
                        } ${
                          tile.walls.west ? 'wall-west' : ''
                        }`}
                        style={{ width: '60px', height: '60px' }}
                      >
                        <img src={`/images/buildings/${tile.type}.jpg`} alt={tile.type} className="building-tile-img" />
                        <div className="building-tile-cost">{tile.cost}</div>
                      </div>
                      
                      <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>{tile.type}</span>
                      
                      <button
                        className="btn-gold"
                        onClick={() => handleBuyClick(i, tile)}
                        disabled={!canBuy}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          marginTop: '8px',
                          width: '100%',
                          cursor: canBuy ? 'pointer' : 'default',
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', margin: '20px 0' }}>
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player reserve section */}
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(195,155,84,0.1)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4 style={{ margin: 0 }}>Your Buildings / Reserve Shelf ({reserve.length})</h4>
                <button
                  className="btn-gold"
                  style={{ padding: '2px 8px', fontSize: '10px' }}
                  onClick={onOpenBuildingsGrid}
                >
                  🔍 Grid View (B)
                </button>
              </div>
              {selectedReserveTileId && (
                <span className="text-gold" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                  Select a cell on the board to place or a tile to swap
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', overflowX: 'auto', padding: '5px 5px 12px 5px' }}>
              {reserve.map(tile => (
                <div
                  key={tile.id}
                  onClick={() => handleReserveTileClick(tile.id)}
                  style={{
                    width: '60px',
                    height: '60px',
                    cursor: activeTurn && actionsRemaining > 0 ? 'pointer' : 'default',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    className={`building-tile-container ${
                      tile.walls.north ? 'wall-north' : ''
                    } ${
                      tile.walls.east ? 'wall-east' : ''
                    } ${
                      tile.walls.south ? 'wall-south' : ''
                    } ${
                      tile.walls.west ? 'wall-west' : ''
                    }`}
                  >
                    <img src={`/images/buildings/${tile.type}.jpg`} alt={tile.type} className="building-tile-img" />
                    <div className="building-tile-cost">{tile.cost}</div>
                  </div>

                  {selectedReserveTileId === tile.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-1px',
                        left: '-1px',
                        right: '-1px',
                        bottom: '-1px',
                        border: '3px solid var(--border-gold)',
                        boxShadow: '0 0 10px rgba(195,155,84,0.8)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        borderRadius: '6px',
                      }}
                    />
                  )}
                </div>
              ))}
              {reserve.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', margin: '10px 0' }}>
                  No buildings in Reserve
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Money Market & Player Hand */}
      {showMoneyMarket && (
        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Money Market <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--text-gold)', marginLeft: '8px' }}>({moneyDeckCount} cards left)</span></h3>
              <button
                className="btn-gold"
                onClick={handleTakeMoneyClick}
                disabled={selectedMarketCards.length === 0 || !activeTurn || actionsRemaining <= 0}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                Draft Money
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {market.money.map(card => (
                <div
                  key={card.id}
                  className={`money-card ${card.currency} ${selectedMarketCards.includes(card.id) ? 'selected' : ''}`}
                  onClick={() => toggleMarketCard(card.id)}
                  style={{ width: '60px', height: '90px', padding: '6px' }}
                >
                  <div style={{ fontSize: '8px' }} className="money-card-currency">{card.currency}</div>
                  <div style={{ fontSize: '20px', marginTop: '5px' }} className="money-card-value">{card.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Player hand selection section */}
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(195,155,84,0.1)', paddingTop: '10px' }}>
            <h4>Your Hand (Select cards to pay)</h4>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
              {playerHand.map(card => (
                <div
                  key={card.id}
                  className={`money-card ${card.currency} ${selectedHandCards.includes(card.id) ? 'selected' : ''}`}
                  onClick={() => toggleHandCard(card.id)}
                  style={{ width: '50px', height: '75px', padding: '5px', flexShrink: 0 }}
                >
                  <div style={{ fontSize: '7px' }} className="money-card-currency">{card.currency}</div>
                  <div style={{ fontSize: '16px', marginTop: '2px' }} className="money-card-value">{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
