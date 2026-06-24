import { GameRoom } from './GameRoom';

export class GameManager {
  private static instance: GameManager;
  private rooms = new Map<string, GameRoom>();

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public createRoom(roomId: string): GameRoom {
    const room = new GameRoom(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }
}
