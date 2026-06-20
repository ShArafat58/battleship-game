import { GameSession, LobbySession, ShipConfig } from "./types";
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
    placedShips: import("./types").PlacedShip[]
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
}
