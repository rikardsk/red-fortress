import { GameState, Player, MoneyCard, BuildingTile, GameAction } from '../types';
import { isValidPlacement } from './GameLogic';

// Find a subset of cards that sums to exactly target
export function findExactSubset(cards: MoneyCard[], target: number): MoneyCard[] | null {
  const result: MoneyCard[] = [];
  
  function backtrack(index: number, currentSum: number): boolean {
    if (currentSum === target) return true;
    if (currentSum > target || index >= cards.length) return false;
    
    // Include
    result.push(cards[index]);
    if (backtrack(index + 1, currentSum + cards[index].value)) return true;
    result.pop(); // backtrack
    
    // Exclude
    return backtrack(index + 1, currentSum);
  }

  return backtrack(0, 0) ? result : null;
}

// Find subset of cards of correct currency that equals or exceeds cost (minimizing overpay)
export function findPaymentSubset(cards: MoneyCard[], cost: number): MoneyCard[] | null {
  const currencyCards = [...cards].sort((a, b) => a.value - b.value);
  const exact = findExactSubset(currencyCards, cost);
  if (exact) return exact;

  // Greedy check: add cards until sum >= cost
  const selected: MoneyCard[] = [];
  let sum = 0;
  for (const card of currencyCards) {
    selected.push(card);
    sum += card.value;
    if (sum >= cost) return selected;
  }
  return null;
}

// Find first valid grid coordinate for a tile on a player's board
export function findPlacementCoordinate(
  board: Record<string, BuildingTile>,
  tile: BuildingTile
): { x: number; y: number } | null {
  const checked = new Set<string>();

  for (const key of Object.keys(board)) {
    const [x, y] = key.split(',').map(Number);
    const neighbors = [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];

    for (const n of neighbors) {
      const nKey = `${n.x},${n.y}`;
      if (checked.has(nKey) || board[nKey] !== undefined) continue;
      checked.add(nKey);

      if (isValidPlacement(board, tile, n.x, n.y)) {
        return n;
      }
    }
  }
  return null;
}

// Choose multiple money cards whose sum is <= 5, or the single card of highest value
export function selectMoneyFromMarket(marketMoney: MoneyCard[]): MoneyCard[] {
  // Check pairs
  for (let i = 0; i < marketMoney.length; i++) {
    for (let j = i + 1; j < marketMoney.length; j++) {
      if (marketMoney[i].value + marketMoney[j].value <= 5) {
        return [marketMoney[i], marketMoney[j]];
      }
    }
  }

  // Otherwise, select highest value single card
  let bestCard = marketMoney[0];
  for (const card of marketMoney) {
    if (card.value > bestCard.value) {
      bestCard = card;
    }
  }
  return [bestCard];
}

// Choose the best AI Action
export function computeAIAction(state: GameState, playerId: string): GameAction {
  const player = state.players.find(p => p.id === playerId)!;

  // 0. If there's a just-bought tile, try to place it immediately (free action)
  if (state.justBoughtTileId) {
    const tile = player.reserve.find(t => t.id === state.justBoughtTileId);
    if (tile) {
      const coord = findPlacementCoordinate(player.board, tile);
      if (coord) {
        return { type: 'PLACE_TILE', tileId: tile.id, x: coord.x, y: coord.y, fromReserve: false };
      }
    }
  }

  // 1. Try to buy with exact change
  const exactBuy = getExactChangeBuyAction(state, player);
  if (exactBuy) return exactBuy;

  // 2. Try to place a tile from Reserve
  const placeReserve = getPlaceReserveAction(player);
  if (placeReserve) return placeReserve;

  // 3. Try to buy any building we can afford
  const normalBuy = getNormalBuyAction(state, player);
  if (normalBuy) return normalBuy;

  // 4. Default: Draw money
  const selectedMoney = selectMoneyFromMarket(state.market.money);
  return {
    type: 'TAKE_MONEY',
    playerHandBefore: player.hand.map(c => c.id),
    cardIds: selectedMoney.map(c => c.id),
  };
}

// Helper: check if we can buy any building in the market with exact change
function getExactChangeBuyAction(state: GameState, player: Player): GameAction | null {
  const currencies: Record<number, typeof state.market.buildings[number]> = { ...state.market.buildings };
  const slotCurrencies: ('Denar' | 'Dirham' | 'Ducats' | 'Florins')[] = ['Denar', 'Dirham', 'Ducats', 'Florins'];

  for (let i = 0; i < 4; i++) {
    const tile = state.market.buildings[i];
    if (!tile) continue;
    
    const curr = slotCurrencies[i];
    const handOfCurrency = player.hand.filter(c => c.currency === curr);
    const subset = findExactSubset(handOfCurrency, tile.cost);
    
    if (subset) {
      return { type: 'BUY_BUILDING', marketIndex: i, cardIds: subset.map(c => c.id) };
    }
  }
  return null;
}

// Helper: check if we can place a tile from Reserve
function getPlaceReserveAction(player: Player): GameAction | null {
  for (const tile of player.reserve) {
    const coord = findPlacementCoordinate(player.board, tile);
    if (coord) {
      return { type: 'PLACE_TILE', tileId: tile.id, x: coord.x, y: coord.y, fromReserve: true };
    }
  }
  return null;
}

// Helper: check if we can buy any building normally (with overpayment)
function getNormalBuyAction(state: GameState, player: Player): GameAction | null {
  const slotCurrencies: ('Denar' | 'Dirham' | 'Ducats' | 'Florins')[] = ['Denar', 'Dirham', 'Ducats', 'Florins'];
  for (let i = 0; i < 4; i++) {
    const tile = state.market.buildings[i];
    if (!tile) continue;

    const curr = slotCurrencies[i];
    const handOfCurrency = player.hand.filter(c => c.currency === curr);
    const subset = findPaymentSubset(handOfCurrency, tile.cost);

    if (subset) {
      return { type: 'BUY_BUILDING', marketIndex: i, cardIds: subset.map(c => c.id) };
    }
  }
  return null;
}
