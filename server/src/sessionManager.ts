import { GameSession, LobbySession, ShipConfig, ShotResultData, PlacedShip } from "./types";
import { v4 as uuidv4 } from "uuid";

export class SessionManager {
  private sessions: Map<string, GameSession> = new Map();

  createSession(
    creatorSocketId: string,
    creatorDisplayName: string,
    gridSize: number,
    ships: ShipConfig[]
  ): GameSession {
    const session: GameSession = {
      id: uuidv4(),
      creatorSocketId,
      creatorDisplayName,
      gridSize,
      ships,
      opponentSocketId: null,
      opponentDisplayName: null,
      status: "waiting",
      creatorReady: false,
      opponentReady: false,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  joinSession(
    sessionId: string,
    opponentSocketId: string,
    opponentDisplayName: string
  ): GameSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "waiting") {
      return null;
    }
    session.opponentSocketId = opponentSocketId;
    session.opponentDisplayName = opponentDisplayName;
    session.status = "active";
    return session;
  }

  removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  removeSessionsByCreator(socketId: string): string[] {
    const removed: string[] = [];
    for (const [id, session] of this.sessions) {
      if (session.creatorSocketId === socketId && session.status === "waiting") {
        this.sessions.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  getOpenSessions(): LobbySession[] {
    const open: LobbySession[] = [];
    for (const session of this.sessions.values()) {
      if (session.status === "waiting") {
        open.push({
          id: session.id,
          creatorDisplayName: session.creatorDisplayName,
          gridSize: session.gridSize,
          ships: session.ships,
        });
      }
    }
    return open;
  }

  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  getWaitingSessionByCreator(socketId: string): GameSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.creatorSocketId === socketId && session.status === "waiting") {
        return session;
      }
    }
    return undefined;
  }

  setPlayerReady(
    sessionId: string,
    socketId: string,
    placedShips: PlacedShip[]
  ): { success: boolean; session?: GameSession } {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "active") return { success: false };

    if (session.creatorSocketId === socketId) {
      session.creatorReady = true;
      session.creatorShips = placedShips;
    } else if (session.opponentSocketId === socketId) {
      session.opponentReady = true;
      session.opponentShips = placedShips;
    } else {
      return { success: false };
    }

    return { success: true, session };
  }

  startBattle(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.currentTurnSocketId = session.creatorSocketId;
    session.creatorShots = [];
    session.opponentShots = [];
  }

  private isShipSunk(ship: PlacedShip, shots: { row: number, col: number, hit: boolean }[]): boolean {
    const hitShots = shots.filter(s => s.hit);
    for (let i = 0; i < ship.size; i++) {
      const r = ship.orientation === "horizontal" ? ship.row : ship.row + i;
      const c = ship.orientation === "horizontal" ? ship.col + i : ship.col;
      if (!hitShots.some(s => s.row === r && s.col === c)) {
        return false;
      }
    }
    return true;
  }

  private allShipsSunk(ships: PlacedShip[], shots: { row: number, col: number, hit: boolean }[]): boolean {
    return ships.every(ship => this.isShipSunk(ship, shots));
  }

  fireShot(
    sessionId: string,
    socketId: string,
    row: number,
    col: number
  ): { success: boolean; result?: ShotResultData; session?: GameSession } {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "active" || session.currentTurnSocketId !== socketId) {
      return { success: false };
    }

    const isCreator = socketId === session.creatorSocketId;
    const opponentShips = isCreator ? session.opponentShips! : session.creatorShips!;
    const myShots = isCreator ? session.creatorShots! : session.opponentShots!;
    const opponentSocketId = isCreator ? session.opponentSocketId! : session.creatorSocketId;

    if (myShots.some(s => s.row === row && s.col === col)) {
      return { success: false }; // Already fired here
    }

    let isHit = false;
    let sunkShip: PlacedShip | undefined = undefined;

    for (const ship of opponentShips) {
      for (let i = 0; i < ship.size; i++) {
        const r = ship.orientation === "horizontal" ? ship.row : ship.row + i;
        const c = ship.orientation === "horizontal" ? ship.col + i : ship.col;
        if (r === row && c === col) {
          isHit = true;
          break;
        }
      }
      if (isHit) {
        // Temporarily add shot to check if sunk
        myShots.push({ row, col, hit: true });
        if (this.isShipSunk(ship, myShots)) {
          sunkShip = ship;
        } else {
          // Revert for now, added properly below
          myShots.pop();
        }
        break;
      }
    }

    myShots.push({ row, col, hit: isHit });

    if (!isHit) {
      session.currentTurnSocketId = opponentSocketId;
    }

    const gameOver = this.allShipsSunk(opponentShips, myShots);

    return {
      success: true,
      session,
      result: {
        row,
        col,
        hit: isHit,
        sunkShip,
        nextTurnSocketId: session.currentTurnSocketId,
        gameOver,
        winnerSocketId: gameOver ? socketId : undefined,
      }
    };
  }
}
