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
  avatar: string;
  isBot: boolean;
  hand: MoneyCard[];
  reserve: BuildingTile[];
  board: Record<string, BuildingTile>; // key format: "x,y"
  score: number;
  longestWall: number;
}

export interface GameMarket {
  money: MoneyCard[];
  buildings: (BuildingTile | null)[];
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
  scoringRound: number;
  actionsRemaining: number;
  logs: string[];
  discardedMoney: MoneyCard[];
  justBoughtTileId: string | null;
}

export type GameAction =
  | { type: 'TAKE_MONEY'; playerHandBefore: string[]; cardIds: string[] }
  | { type: 'BUY_BUILDING'; marketIndex: number; cardIds: string[] }
  | { type: 'PLACE_TILE'; tileId: string; x: number; y: number; fromReserve: boolean }
  | { type: 'RESERVE_TILE'; x: number; y: number }
  | { type: 'SWAP_TILE'; boardKey: string; reserveTileId: string }
  | { type: 'END_TURN' };
