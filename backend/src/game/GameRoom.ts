import { WebSocket } from 'ws';
import { GameState, Player, MoneyCard, BuildingTile, GameAction } from '../types';
import {
  setupMoneyDeck,
  createBuildingBag,
  getFountainTile,
  isValidPlacement,
  scoreGame,
} from './GameLogic';
import { computeAIAction, findExactSubset, findPaymentSubset } from './AIPlayer';

export class GameRoom {
  public state: GameState;
  private sockets = new Map<string, WebSocket>();
  private aiTimeout: NodeJS.Timeout | null = null;
  private fullLogs: { text: string; senderId?: string; recipientId?: string }[] = [];

  constructor(roomId: string) {
    this.fullLogs = [];
    this.state = {
      roomId,
      players: [],
      currentTurnPlayerId: '',
      moneyDeck: [],
      buildingBag: [],
      market: { money: [], buildings: [null, null, null, null] },
      status: 'LOBBY',
      winnerId: null,
      scoringRound: 0,
      actionsRemaining: 0,
      logs: [],
      discardedMoney: [],
      justBoughtTileId: null,
    };
  }

  // Add socket connection for a player
  public registerSocket(playerId: string, socket: WebSocket): void {
    this.sockets.set(playerId, socket);
    const filteredLogs = this.fullLogs
      .filter(log => !log.recipientId || log.senderId === playerId || log.recipientId === playerId)
      .map(log => log.text);

    const personalizedState = {
      ...this.state,
      logs: filteredLogs
    };
    socket.send(JSON.stringify({ type: 'STATE_UPDATE', state: personalizedState }));
  }

  // Remove socket connection
  public removeSocket(playerId: string): void {
    this.sockets.delete(playerId);
  }

  // Join lobby
  public joinLobby(id: string, name: string, avatar: string, isBot = false): boolean {
    if (this.state.status !== 'LOBBY' || this.state.players.length >= 6) return false;
    if (this.state.players.some(p => p.avatar === avatar)) return false;

    this.state.players.push({
      id,
      name,
      avatar,
      isBot,
      hand: [],
      reserve: [],
      board: { '0,0': getFountainTile() },
      score: 0,
      longestWall: 0,
    });
    this.log(`${name} joined as the ${avatar}.`);
    this.broadcastState();
    return true;
  }

  // Start the game
  public startGame(): void {
    if (this.state.status !== 'LOBBY' || this.state.players.length < 3) return;

    this.state.moneyDeck = setupMoneyDeck();
    this.state.buildingBag = createBuildingBag();
    this.dealInitialHands();
    this.replenishMarkets();

    this.state.status = 'PLAYING';
    this.state.currentTurnPlayerId = this.state.players[0].id;
    this.state.actionsRemaining = 1;

    this.log('The game of Red Fortress has started!');
    this.broadcastState();
    this.triggerAILoop();
  }

  // Restart the game (return to lobby)
  public restartGame(): void {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    this.state.status = 'LOBBY';
    this.state.winnerId = null;
    this.state.scoringRound = 0;
    this.state.actionsRemaining = 0;
    this.state.moneyDeck = [];
    this.state.buildingBag = [];
    this.state.market = { money: [], buildings: [null, null, null, null] };
    this.state.discardedMoney = [];
    this.state.justBoughtTileId = null;

    for (const player of this.state.players) {
      player.hand = [];
      player.reserve = [];
      player.board = { '0,0': getFountainTile() };
      player.score = 0;
      player.longestWall = 0;
    }

    this.fullLogs = [];
    this.state.logs = [];
    this.log('The game room has been reset to lobby.');
    this.broadcastState();
  }

  // Remove a bot player from lobby
  public removeBot(botId: string): void {
    if (this.state.status !== 'LOBBY') return;
    const idx = this.state.players.findIndex(p => p.id === botId && p.isBot);
    if (idx === -1) return;

    const name = this.state.players[idx].name;
    this.state.players.splice(idx, 1);
    this.log(`${name} was removed from the lobby.`);
    this.broadcastState();
  }

  // Handle incoming actions from client
  public handleAction(playerId: string, action: GameAction): void {
    if (this.state.status !== 'PLAYING') return;
    if (this.state.currentTurnPlayerId !== playerId) return;
    if (this.state.actionsRemaining <= 0 && action.type !== 'END_TURN') return;

    this.processAction(playerId, action);
    this.broadcastState();

    if (this.state.actionsRemaining <= 0) {
      this.endTurn();
    } else {
      const currentPlayer = this.state.players.find(p => p.id === this.state.currentTurnPlayerId);
      if (currentPlayer && currentPlayer.isBot) {
        this.triggerAILoop();
      }
    }
  }

  // Process specific actions
  private processAction(playerId: string, action: GameAction): void {
    if (action.type === 'TAKE_MONEY') {
      this.handleTakeMoney(playerId, action.cardIds);
    } else if (action.type === 'BUY_BUILDING') {
      this.handleBuyBuilding(playerId, action.marketIndex, action.cardIds);
    } else if (action.type === 'PLACE_TILE') {
      this.handlePlaceTile(playerId, action.tileId, action.x, action.y, action.fromReserve);
    } else if (action.type === 'RESERVE_TILE') {
      this.handleReserveTile(playerId, action.x, action.y);
    } else if (action.type === 'SWAP_TILE') {
      this.handleSwapTile(playerId, action.boardKey, action.reserveTileId);
    } else if (action.type === 'END_TURN') {
      this.endTurn();
    }
  }

  // Draw cards to players until total value >= 20
  private dealInitialHands(): void {
    for (const player of this.state.players) {
      let sum = 0;
      while (sum < 20 && this.state.moneyDeck.length > 0) {
        const card = this.state.moneyDeck.shift()!;
        if (card.value < 0) {
          // If a scoring card is drawn during initial deal, reshuffle it back in
          this.state.moneyDeck.push(card);
          this.state.moneyDeck = setupMoneyDeck();
          continue;
        }
        player.hand.push(card);
        sum += card.value;
      }
    }
  }

  // Action: Take money
  private handleTakeMoney(playerId: string, cardIds: string[]): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const cards = this.state.market.money.filter(c => cardIds.includes(c.id));

    if (cards.length === 0) return;
    if (cards.length > 1 && cards.reduce((sum, c) => sum + c.value, 0) > 5) return;

    // Remove from market, add to hand
    this.state.market.money = this.state.market.money.filter(c => !cardIds.includes(c.id));
    player.hand.push(...cards);
    this.state.actionsRemaining--;
    this.state.justBoughtTileId = null;

    this.log(`${player.name} took money cards: ${cards.map(c => `${c.currency} ${c.value}`).join(', ')}.`);
  }

  // Action: Buy building
  private handleBuyBuilding(playerId: string, marketIdx: number, cardIds: string[]): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const tile = this.state.market.buildings[marketIdx];
    if (!tile) return;

    const cards = player.hand.filter(c => cardIds.includes(c.id));
    const currency = (['Denar', 'Dirham', 'Ducats', 'Florins'] as const)[marketIdx];
    if (cards.some(c => c.currency !== currency)) return;

    // Optimize payment cards: try exact change first, then minimal payment subset
    let optimalCards = findExactSubset(cards, tile.cost);
    if (!optimalCards) {
      optimalCards = findPaymentSubset(cards, tile.cost);
    }

    const finalCardsToSpend = optimalCards || cards;
    const totalPaid = finalCardsToSpend.reduce((sum, c) => sum + c.value, 0);
    if (totalPaid < tile.cost) return;

    // Execute transaction
    this.executeTransaction(player, marketIdx, tile, finalCardsToSpend, totalPaid);
  }

  // Execute the money/tile transaction details
  private executeTransaction(
    player: Player,
    marketIdx: number,
    tile: BuildingTile,
    cards: MoneyCard[],
    totalPaid: number
  ): void {
    // Remove cards from hand, add to discard
    player.hand = player.hand.filter(c => !cards.some(tc => tc.id === c.id));
    this.state.discardedMoney.push(...cards);

    // Place building in reserve, set justBoughtTileId
    player.reserve.push(tile);
    this.state.market.buildings[marketIdx] = null;
    this.state.justBoughtTileId = tile.id;

    const exact = totalPaid === tile.cost;
    if (!exact) {
      this.state.actionsRemaining--;
    }

    this.log(
      `${player.name} bought ${tile.type} (cost ${tile.cost}) for ${totalPaid} ${exact ? '(Exact Change! Extra Action)' : ''}.`
    );
  }

  // Action: Place tile onto board
  private handlePlaceTile(playerId: string, tileId: string, x: number, y: number, fromReserve: boolean): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const tile = player.reserve.find(t => t.id === tileId);
    if (!tile) return;

    if (fromReserve) {
      if (this.state.actionsRemaining <= 0) return;
      this.state.actionsRemaining--;
    } else {
      if (this.state.justBoughtTileId !== tileId) return;
    }

    if (!isValidPlacement(player.board, tile, x, y)) return;

    player.reserve = player.reserve.filter(t => t.id !== tileId);
    player.board[`${x},${y}`] = tile;
    if (!fromReserve) this.state.justBoughtTileId = null;

    this.log(`${player.name} placed ${tile.type} at (${x}, ${y}).`);
  }

  // Action: Move tile from board to Reserve
  private handleReserveTile(playerId: string, x: number, y: number): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const tile = player.board[`${x},${y}`];
    if (!tile || (x === 0 && y === 0)) return; // cannot reserve starting Fountain

    const tempBoard = { ...player.board };
    delete tempBoard[`${x},${y}`];

    if (!scoreGame([player], 0)) return; // dummy score call or custom validation, wait, let's use isBoardValid
    // Let's use isBoardValid from GameLogic
    const { isBoardValid } = require('./GameLogic');
    if (!isBoardValid(tempBoard)) return;

    delete player.board[`${x},${y}`];
    player.reserve.push(tile);
    this.state.actionsRemaining--;
    this.state.justBoughtTileId = null;

    this.log(`${player.name} moved ${tile.type} from board to Reserve.`);
  }

  // Action: Swap tile from Board with Reserve tile
  private handleSwapTile(playerId: string, boardKey: string, reserveTileId: string): void {
    const player = this.state.players.find(p => p.id === playerId)!;
    const [bx, by] = boardKey.split(',').map(Number);
    const boardTile = player.board[boardKey];
    const reserveTile = player.reserve.find(t => t.id === reserveTileId);

    if (!boardTile || !reserveTile || (bx === 0 && by === 0)) return;

    const tempBoard = { ...player.board, [boardKey]: reserveTile };
    const { isBoardValid, checkAdjacentWalls } = require('./GameLogic');
    if (!checkAdjacentWalls(player.board, reserveTile, bx, by) || !isBoardValid(tempBoard)) return;

    player.board[boardKey] = reserveTile;
    player.reserve = player.reserve.filter(t => t.id !== reserveTileId);
    player.reserve.push(boardTile);
    this.state.actionsRemaining--;
    this.state.justBoughtTileId = null;

    this.log(`${player.name} swapped board tile ${boardTile.type} with reserve tile ${reserveTile.type}.`);
  }

  // End turn, replenish markets, advance player
  private endTurn(): void {
    this.state.justBoughtTileId = null;
    this.replenishMarkets();

    if (this.isGameOver()) {
      this.finishGame();
      return;
    }

    const currentIdx = this.state.players.findIndex(p => p.id === this.state.currentTurnPlayerId);
    const nextIdx = (currentIdx + 1) % this.state.players.length;
    this.state.currentTurnPlayerId = this.state.players[nextIdx].id;
    this.state.actionsRemaining = 1;

    this.broadcastState();
    this.triggerAILoop();
  }

  // Replenish markets (both money and building markets)
  private replenishMarkets(): void {
    // Replenish Money Market
    while (this.state.market.money.length < 4 && this.state.moneyDeck.length > 0) {
      const card = this.state.moneyDeck.shift()!;
      if (card.value < 0) {
        this.triggerScoringRound(card.id === 'SCORING_1' ? 0 : 1);
        continue;
      }
      this.state.market.money.push(card);
    }

    // Replenish Building Market
    for (let i = 0; i < 4; i++) {
      if (this.state.market.buildings[i] === null && this.state.buildingBag.length > 0) {
        this.state.market.buildings[i] = this.state.buildingBag.shift()!;
      }
    }
  }

  // Check if scoring cards are drawn or building bag runs dry
  private isGameOver(): boolean {
    // Game ends when we cannot refill the building market completely
    return this.state.market.buildings.some(b => b === null) && this.state.buildingBag.length === 0;
  }

  // Trigger final scoring and end the game
  private finishGame(): void {
    this.state.status = 'FINISHED';
    
    // Final scoring round (Round 3)
    this.state.players = scoreGame(this.state.players, 2);

    let winner = this.state.players[0];
    for (const p of this.state.players) {
      if (p.score > winner.score) {
        winner = p;
      }
    }
    this.state.winnerId = winner.id;
    this.log(`Game Over! The winner is ${winner.name} with ${winner.score} points!`);
    this.broadcastState();
  }

  // Trigger a scoring round
  private triggerScoringRound(roundNum: number): void {
    this.log(`Scoring Round ${roundNum + 1} Triggered!`);
    this.state.players = scoreGame(this.state.players, roundNum);
    this.state.scoringRound = roundNum + 1;
    this.broadcastState();
  }

  // AI loop
  private triggerAILoop(): void {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    if (this.state.status !== 'PLAYING') return;

    const currentPlayer = this.state.players.find(p => p.id === this.state.currentTurnPlayerId)!;
    if (!currentPlayer.isBot) return;

    this.aiTimeout = setTimeout(() => {
      const action = computeAIAction(this.state, currentPlayer.id);
      this.handleAction(currentPlayer.id, action);
    }, 1000);
  }

  // Logging utility
  private log(message: string): void {
    const text = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.fullLogs.push({ text });
    this.state.logs.push(text);
  }

  // Handle chat messaging (both public and whispers)
  public handleChat(senderId: string, senderName: string, text: string, targetPlayerId?: string): void {
    if (targetPlayerId && targetPlayerId !== '' && targetPlayerId !== 'all') {
      const recipient = this.state.players.find(p => p.id === targetPlayerId);
      if (recipient) {
        const whisperText = `[WHISPER] ${senderName} to ${recipient.name}: ${text}`;
        this.fullLogs.push({
          text: whisperText,
          senderId,
          recipientId: targetPlayerId
        });
      }
    } else {
      const chatText = `[CHAT] ${senderName}: ${text}`;
      this.fullLogs.push({
        text: chatText,
        senderId
      });
      this.state.logs.push(chatText);
    }
    this.broadcastState();
  }

  // Broadcast game state to all players
  public broadcastState(): void {
    for (const [playerId, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        const filteredLogs = this.fullLogs
          .filter(log => !log.recipientId || log.senderId === playerId || log.recipientId === playerId)
          .map(log => log.text);

        const personalizedState = {
          ...this.state,
          logs: filteredLogs
        };
        ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: personalizedState }));
      }
    }
  }

  // Send message to specific player
  private sendTo(playerId: string, message: any): void {
    const ws = this.sockets.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to all connected clients
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    for (const ws of this.sockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
