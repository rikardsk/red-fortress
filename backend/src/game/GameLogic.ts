import {
  Currency,
  MoneyCard,
  BuildingType,
  Walls,
  BuildingTile,
  Player,
  GameState,
} from '../types';

// 1. Create Money Deck: 108 cards (4 currencies * 9 values (1-9) * 3 copies)
export function createMoneyDeck(): MoneyCard[] {
  const currencies: Currency[] = ['Denar', 'Dirham', 'Ducats', 'Florins'];
  const deck: MoneyCard[] = [];
  let idCounter = 1;

  for (const currency of currencies) {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 3; i++) {
        deck.push({
          id: `money_${currency}_${value}_${idCounter++}`,
          currency,
          value,
        });
      }
    }
  }
  return deck;
}

// 2. Generic Shuffle Function
export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 3. Prepare money deck with scoring cards inserted in 2nd and 3rd thirds
export function setupMoneyDeck(): MoneyCard[] {
  const deck = shuffle(createMoneyDeck());
  const size = Math.floor(deck.length / 3);
  
  const part1 = deck.slice(0, size);
  const part2 = deck.slice(size, size * 2);
  const part3 = deck.slice(size * 2);

  // Insert scoring cards
  part2.push({ id: 'SCORING_1', currency: 'Denar', value: -1 });
  part3.push({ id: 'SCORING_2', currency: 'Denar', value: -2 });

  return [
    ...part1,
    ...shuffle(part2),
    ...shuffle(part3),
  ];
}

// 4. Create building tile bag (54 tiles of 6 building types, excluding Fountain)
// We generate wall configurations programmatically.
export function createBuildingBag(): BuildingTile[] {
  const types: BuildingType[] = ['Chamber', 'Garden', 'Manor', 'Mezzanine', 'Pavilion', 'Tower'];
  const bag: BuildingTile[] = [];
  let idCounter = 1;

  for (const type of types) {
    for (let cost = 2; cost <= 10; cost++) {
      bag.push({
        id: `tile_${type}_${cost}_${idCounter++}`,
        type,
        cost,
        walls: getWallConfigForIndex(cost),
      });
    }
  }
  return bag;
}

// Helper to distribute wall patterns programmatically based on index/cost
function getWallConfigForIndex(cost: number): Walls {
  // Rotate wall patterns to create variety
  const configs: Walls[] = [
    { north: true, east: false, south: false, west: false },  // 1 wall
    { north: false, east: true, south: false, west: false },  // 1 wall
    { north: true, east: true, south: false, west: false },   // 2 walls (corner)
    { north: false, east: true, south: true, west: false },   // 2 walls (corner)
    { north: true, east: false, south: true, west: false },   // 2 walls (opposite)
    { north: true, east: true, south: true, west: false },    // 3 walls
    { north: false, east: true, south: true, west: true },    // 3 walls
    { north: false, east: false, south: false, west: false }, // 0 walls
    { north: false, east: false, south: true, west: false },  // 1 wall
  ];
  return configs[cost % configs.length];
}

// Get starting Fountain tile
export function getFountainTile(): BuildingTile {
  return {
    id: 'tile_Fountain_start',
    type: 'Fountain',
    cost: 0,
    walls: { north: false, east: false, south: false, west: false },
  };
}

// Check if coordinate is adjacent to any tile on board
export function isAdjacent(board: Record<string, BuildingTile>, x: number, y: number): boolean {
  const neighbors = [
    `${x},${y+1}`,
    `${x},${y-1}`,
    `${x+1},${y}`,
    `${x-1},${y}`,
  ];
  return neighbors.some(key => board[key] !== undefined);
}

// Check wall matching between tile 1 and tile 2 in a given direction
// direction is relative to t1 (e.g. 'north' means t2 is north of t1)
export function wallMatches(t1: BuildingTile, t2: BuildingTile, direction: 'north' | 'east' | 'south' | 'west'): boolean {
  if (direction === 'north') return t1.walls.north === t2.walls.south;
  if (direction === 'east') return t1.walls.east === t2.walls.west;
  if (direction === 'south') return t1.walls.south === t2.walls.north;
  return t1.walls.west === t2.walls.east;
}

// Validate single adjacency check for placement at x, y
export function checkAdjacentWalls(board: Record<string, BuildingTile>, tile: BuildingTile, x: number, y: number): boolean {
  const n = board[`${x},${y+1}`];
  const s = board[`${x},${y-1}`];
  const e = board[`${x+1},${y}`];
  const w = board[`${x-1},${y}`];

  if (n && !wallMatches(tile, n, 'north')) return false;
  if (s && !wallMatches(tile, s, 'south')) return false;
  if (e && !wallMatches(tile, e, 'east')) return false;
  if (w && !wallMatches(tile, w, 'west')) return false;

  return true;
}

// Get reachable tiles starting from Fountain (0,0) without crossing walls
export function getReachableTiles(board: Record<string, BuildingTile>): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = ['0,0'];
  visited.add('0,0');

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const [cx, cy] = curr.split(',').map(Number);
    const tile = board[curr];
    if (!tile) continue;

    addValidNeighborsToQueue(board, tile, cx, cy, visited, queue);
  }
  return visited;
}

// Helper to push valid open-edge neighbors to queue
function addValidNeighborsToQueue(
  board: Record<string, BuildingTile>,
  tile: BuildingTile,
  cx: number,
  cy: number,
  visited: Set<string>,
  queue: string[]
): void {
  const directions: { dir: 'north' | 'east' | 'south' | 'west'; dx: number; dy: number; wallKey: keyof Walls }[] = [
    { dir: 'north', dx: 0, dy: 1, wallKey: 'north' },
    { dir: 'south', dx: 0, dy: -1, wallKey: 'south' },
    { dir: 'east', dx: 1, dy: 0, wallKey: 'east' },
    { dir: 'west', dx: -1, dy: 0, wallKey: 'west' },
  ];

  for (const { dir, dx, dy, wallKey } of directions) {
    if (tile.walls[wallKey]) continue; // wall is blocked
    const key = `${cx + dx},${cy + dy}`;
    const neighbor = board[key];
    if (neighbor && !visited.has(key) && !wallMatches(tile, neighbor, dir)) {
      // wall misaligned - but wait, wallMatches must return true (both open-to-open, i.e. both false)
      // since we already checked tile.walls[wallKey] is false, wallMatches will ensure neighbor's opposing side is also false.
      continue; 
    }
    if (neighbor && !visited.has(key)) {
      visited.add(key);
      queue.push(key);
    }
  }
}

// Check if entire board is fully connected and reachable from Fountain
export function isBoardValid(board: Record<string, BuildingTile>): boolean {
  const totalTiles = Object.keys(board).length;
  const reachable = getReachableTiles(board);
  return reachable.size === totalTiles;
}

// Full placement validator
export function isValidPlacement(
  board: Record<string, BuildingTile>,
  tile: BuildingTile,
  x: number,
  y: number
): boolean {
  if (x === 0 && y === 0) return false;
  if (board[`${x},${y}`]) return false;
  if (!isAdjacent(board, x, y)) return false;
  if (!checkAdjacentWalls(board, tile, x, y)) return false;

  // Perform hypothetical check
  const tempBoard = { ...board, [`${x},${y}`]: tile };
  return isBoardValid(tempBoard);
}

// Calculate the longest wall segment path
// We find all unique wall edges on the grid and find the longest simple path.
export function getLongestWall(board: Record<string, BuildingTile>): number {
  const edges = collectWallEdges(board);
  let maxLength = 0;

  // Build adjacency list for corners
  const adj: Record<string, string[]> = {};
  for (const edge of edges) {
    const [c1, c2] = edge.split(';');
    if (!adj[c1]) adj[c1] = [];
    if (!adj[c2]) adj[c2] = [];
    adj[c1].push(c2);
    adj[c2].push(c1);
  }

  // Find longest simple path using DFS from every node
  const visitedEdges = new Set<string>();
  for (const startNode of Object.keys(adj)) {
    const len = dfsLongestPath(startNode, adj, visitedEdges);
    if (len > maxLength) maxLength = len;
  }

  return maxLength;
}

// Helper to format edge key consistently
function makeEdgeKey(c1: string, c2: string): string {
  return [c1, c2].sort().join(';');
}

// Collect all unique wall segments in corner coordinate graph
function collectWallEdges(board: Record<string, BuildingTile>): Set<string> {
  const edges = new Set<string>();
  for (const key of Object.keys(board)) {
    const [x, y] = key.split(',').map(Number);
    const tile = board[key];
    if (!tile) continue;

    addTileWallsToEdges(tile, x, y, edges);
  }
  return edges;
}

// Helper to add edges for individual tile
function addTileWallsToEdges(tile: BuildingTile, x: number, y: number, edges: Set<string>): void {
  const cBL = `${x},${y}`;
  const cBR = `${x + 1},${y}`;
  const cTL = `${x},${y + 1}`;
  const cTR = `${x + 1},${y + 1}`;

  if (tile.walls.north) edges.add(makeEdgeKey(cTL, cTR));
  if (tile.walls.east) edges.add(makeEdgeKey(cTR, cBR));
  if (tile.walls.south) edges.add(makeEdgeKey(cBL, cBR));
  if (tile.walls.west) edges.add(makeEdgeKey(cBL, cTL));
}

// Backtracking DFS to find longest simple path of edges
function dfsLongestPath(curr: string, adj: Record<string, string[]>, visitedEdges: Set<string>): number {
  let maxSubPath = 0;
  const neighbors = adj[curr] || [];

  for (const neighbor of neighbors) {
    const edge = makeEdgeKey(curr, neighbor);
    if (visitedEdges.has(edge)) continue;

    visitedEdges.add(edge);
    const len = 1 + dfsLongestPath(neighbor, adj, visitedEdges);
    if (len > maxSubPath) maxSubPath = len;
    visitedEdges.delete(edge); // backtrack
  }

  return maxSubPath;
}

// Calculate scoreboard points based on building counts & longest wall
export function scoreGame(players: Player[], round: number): Player[] {
  const newPlayers = players.map(p => ({ ...p, longestWall: getLongestWall(p.board) }));
  const buildingTypes: BuildingType[] = ['Pavilion', 'Manor', 'Mezzanine', 'Chamber', 'Garden', 'Tower'];
  
  // Point mappings per round for [1st, 2nd, 3rd]
  const scoringValues: Record<BuildingType, number[][]> = {
    Pavilion: [[1], [8, 1], [16, 8, 1]],
    Manor: [[2], [9, 2], [17, 9, 2]],
    Mezzanine: [[3], [10, 3], [18, 10, 3]],
    Chamber: [[4], [11, 4], [19, 11, 4]],
    Garden: [[5], [12, 5], [20, 12, 5]],
    Tower: [[6], [13, 6], [21, 13, 6]],
    Fountain: [[0], [0, 0], [0, 0, 0]],
  };

  for (const type of buildingTypes) {
    awardBuildingScores(newPlayers, type, scoringValues[type][round]);
  }

  // Add longest wall scores
  for (const p of newPlayers) {
    p.score += p.longestWall;
  }

  return newPlayers;
}

// Award points for a specific building type based on majorities
function awardBuildingScores(players: Player[], type: BuildingType, rewardDistribution: number[]): void {
  // Count buildings for each player
  const counts = players.map(p => {
    const count = Object.values(p.board).filter(t => t.type === type).length;
    return { player: p, count };
  });

  // Group by counts descending
  counts.sort((a, b) => b.count - a.count);
  
  // We need to resolve ties. Let's group players by count
  const groups: { count: number; players: Player[] }[] = [];
  for (const item of counts) {
    let group = groups.find(g => g.count === item.count);
    if (!group) {
      group = { count: item.count, players: [] };
      groups.push(group);
    }
    group.players.push(item.player);
  }

  distributeRewardsToGroups(groups, rewardDistribution);
}

// Helper to distribute reward array over grouped players (with ties splitting points)
function distributeRewardsToGroups(groups: { count: number; players: Player[] }[], rewardDistribution: number[]): void {
  let rewardIdx = 0;
  for (const group of groups) {
    if (group.count === 0) continue; // no tiles means no score
    if (rewardIdx >= rewardDistribution.length) break;

    const numPlayers = group.players.length;
    const availableRewards = rewardDistribution.slice(rewardIdx, rewardIdx + numPlayers);
    const sumRewards = availableRewards.reduce((sum, val) => sum + val, 0);
    const avgScore = Math.floor(sumRewards / numPlayers);

    for (const player of group.players) {
      player.score += avgScore;
    }
    rewardIdx += numPlayers;
  }
}
