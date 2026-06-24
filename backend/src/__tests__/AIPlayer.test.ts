import { describe, it, expect } from 'vitest';
import { findExactSubset, selectMoneyFromMarket, computeAIAction } from '../game/AIPlayer';
import { MoneyCard, GameState, Player } from '../types';
import { getFountainTile } from '../game/GameLogic';

describe('AIPlayer tests', () => {
  it('finds exact subset sums correctly', () => {
    const cards: MoneyCard[] = [
      { id: '1', currency: 'Denar', value: 2 },
      { id: '2', currency: 'Denar', value: 3 },
      { id: '3', currency: 'Denar', value: 5 },
      { id: '4', currency: 'Denar', value: 7 },
    ];

    const res = findExactSubset(cards, 10);
    expect(res).not.toBeNull();
    const sum = res!.reduce((s, c) => s + c.value, 0);
    expect(sum).toBe(10);
  });

  it('selects multiple money cards <= 5 or the highest single card', () => {
    const market1: MoneyCard[] = [
      { id: '1', currency: 'Denar', value: 2 },
      { id: '2', currency: 'Dirham', value: 3 },
      { id: '3', currency: 'Florins', value: 8 },
      { id: '4', currency: 'Ducats', value: 9 },
    ];
    // should pick 2 and 3 because sum is 5
    const pick1 = selectMoneyFromMarket(market1);
    expect(pick1.length).toBe(2);
    expect(pick1.map(c => c.value)).toContain(2);
    expect(pick1.map(c => c.value)).toContain(3);

    const market2: MoneyCard[] = [
      { id: '1', currency: 'Denar', value: 4 },
      { id: '2', currency: 'Dirham', value: 3 },
      { id: '3', currency: 'Florins', value: 8 },
      { id: '4', currency: 'Ducats', value: 9 },
    ];
    // no pair <= 5, should pick 9
    const pick2 = selectMoneyFromMarket(market2);
    expect(pick2.length).toBe(1);
    expect(pick2[0].value).toBe(9);
  });

  it('places a just bought tile immediately if possible', () => {
    const player: Player = {
      id: 'bot1',
      name: 'Bot 1',
      avatar: 'Bear',
      isBot: true,
      hand: [],
      reserve: [
        {
          id: 'tile_chamber_4',
          type: 'Chamber',
          cost: 4,
          walls: { north: false, east: false, south: false, west: false },
        },
      ],
      board: {
        '0,0': getFountainTile(),
      },
      score: 0,
      longestWall: 0,
    };

    const state: GameState = {
      roomId: 'room1',
      players: [player],
      currentTurnPlayerId: 'bot1',
      moneyDeck: [],
      buildingBag: [],
      market: { money: [], buildings: [null, null, null, null] },
      status: 'PLAYING',
      winnerId: null,
      scoringRound: 0,
      actionsRemaining: 1,
      logs: [],
      discardedMoney: [],
      justBoughtTileId: 'tile_chamber_4',
    };

    const action = computeAIAction(state, 'bot1');
    expect(action.type).toBe('PLACE_TILE');
    if (action.type === 'PLACE_TILE') {
      expect(action.tileId).toBe('tile_chamber_4');
      expect(action.fromReserve).toBe(false);
    }
  });
});
