import { BuildingTile } from '../types';

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
