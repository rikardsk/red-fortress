import { describe, it, expect } from 'vitest';
import {
  isAdjacent,
  isValidPlacement,
  isBoardValid,
  getLongestWall,
  scoreGame,
  getFountainTile,
} from '../game/GameLogic';
import { BuildingTile, Player } from '../types';

describe('GameLogic tests', () => {
  const fountain = getFountainTile();

  it('verifies adjacency correctly', () => {
    const board: Record<string, BuildingTile> = {
      '0,0': fountain,
    };
    expect(isAdjacent(board, 0, 1)).toBe(true);
    expect(isAdjacent(board, 1, 0)).toBe(true);
    expect(isAdjacent(board, 2, 2)).toBe(false);
  });

  it('validates wall alignments and connectivity', () => {
    const board: Record<string, BuildingTile> = {
      '0,0': fountain,
    };

    const tileOpen: BuildingTile = {
      id: 'tile_1',
      type: 'Garden',
      cost: 5,
      walls: { north: false, east: false, south: false, west: false },
    };

    const tileWithSouthWall: BuildingTile = {
      id: 'tile_2',
      type: 'Tower',
      cost: 8,
      walls: { north: false, east: false, south: true, west: false },
    };

    // Valid placement: open sides match, connected to 0,0
    expect(isValidPlacement(board, tileOpen, 0, 1)).toBe(true);

    // Invalid placement: placing south wall of tile_2 touching north of fountain (open)
    // Wait, tile_2 has south wall = true. fountain has north wall = false. They mismatch!
    expect(isValidPlacement(board, tileWithSouthWall, 0, 1)).toBe(false);
  });

  it('verifies the longest wall BFS/DFS segment counter', () => {
    // Let's create a board:
    // Fountain at 0,0 (no walls)
    // Garden at 0,1 with north wall
    // Chamber at 1,1 with north and east walls
    const board: Record<string, BuildingTile> = {
      '0,0': fountain,
      '0,1': {
        id: 't1',
        type: 'Garden',
        cost: 5,
        walls: { north: true, east: false, south: false, west: false },
      },
      '1,1': {
        id: 't2',
        type: 'Chamber',
        cost: 6,
        walls: { north: true, east: true, south: false, west: false },
      },
    };

    // Edges should be:
    // t1 North wall: (0, 2) to (1, 2)
    // t2 North wall: (1, 2) to (2, 2)
    // t2 East wall: (2, 2) to (2, 1)
    // Connected: (0, 2) -> (1, 2) -> (2, 2) -> (2, 1). This is a single continuous wall of length 3!
    const longest = getLongestWall(board);
    expect(longest).toBe(3);
  });

  it('calculates score standings correctly', () => {
    // Create two players
    const p1: Player = {
      id: 'p1',
      name: 'Bear',
      avatar: 'Bear',
      isBot: false,
      hand: [],
      reserve: [],
      board: {
        '0,0': fountain,
        '0,1': { id: 't1', type: 'Garden', cost: 5, walls: { north: true, east: false, south: false, west: false } }, // 1 Garden
      },
      score: 0,
      longestWall: 0,
    };

    const p2: Player = {
      id: 'p2',
      name: 'Orca',
      avatar: 'Orca',
      isBot: false,
      hand: [],
      reserve: [],
      board: {
        '0,0': fountain,
      },
      score: 0,
      longestWall: 0,
    };

    const scored = scoreGame([p1, p2], 0); // Round 1
    // p1 has 1 Garden, p2 has 0. Garden gives 5 points to 1st place in round 1
    // p1 longest wall is 1, so p1 score should be 5 (Garden) + 1 (longest wall) = 6
    // p2 longest wall is 0, so p2 score should be 0
    const scoredP1 = scored.find(p => p.id === 'p1')!;
    const scoredP2 = scored.find(p => p.id === 'p2')!;

    expect(scoredP1.score).toBe(6);
    expect(scoredP2.score).toBe(0);
  });
});
