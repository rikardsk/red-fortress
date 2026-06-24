export type Currency = 'Denar' | 'Dirham' | 'Ducats' | 'Florins';

export interface MoneyCard {
  id: string;
  currency: Currency;
  value: number;
}

export type BuildingType =
  | 'Chamber'
  | 'Fountain'
  | 'Garden'
  | 'Manor'
  | 'Mezzanine'
  | 'Pavilion'
  | 'Tower';

export interface Walls {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export interface BuildingTile {
  id: string;
  type: BuildingType;
  cost: number;
  walls: Walls;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // 'Bear' | 'Eagle' | 'Elephant' | 'Gorilla' | 'Lion' | 'Orca'
  isBot: boolean;
  hand: MoneyCard[];
  reserve: BuildingTile[];
  board: Record<string, BuildingTile>; // key format: "x,y"
  score: number;
  longestWall: number;
}

export interface GameMarket {
  money: MoneyCard[]; // exactly 4 face-up cards
  buildings: (BuildingTile | null)[]; // 4 slots: Denar (0), Dirham (1), Ducats (2), Florins (3)
}

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export interface GameState {
  roomId: string;
  players: Player[];
  currentTurnPlayerId: string;
  moneyDeck: MoneyCard[];
  buildingBag: BuildingTile[];
  market: GameMarket;
  status: GameStatus;
  winnerId: string | null;
  scoringRound: number; // 0, 1, or 2 (after the final round, game is FINISHED)
  actionsRemaining: number; // starts at 1, gains +1 on exact change
  logs: string[];
  discardedMoney: MoneyCard[];
  justBoughtTileId: string | null; // Tracks tile bought during the current action
}

export type GameAction =
  | { type: 'TAKE_MONEY'; playerHandBefore: string[]; cardIds: string[] }
  | { type: 'BUY_BUILDING'; marketIndex: number; cardIds: string[] }
  | { type: 'PLACE_TILE'; tileId: string; x: number; y: number; fromReserve: boolean }
  | { type: 'RESERVE_TILE'; x: number; y: number }
  | { type: 'SWAP_TILE'; boardKey: string; reserveTileId: string }
  | { type: 'END_TURN' };
