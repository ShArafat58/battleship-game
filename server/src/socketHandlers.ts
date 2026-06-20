import { Server, Socket } from "socket.io";
import { UserManager } from "./userManager";
import { SessionManager } from "./sessionManager";
import { ShipConfig, PlayerPlacement, ShotData } from "./types";
import { recordGameResult, getLeaderboard } from "./db";

export function registerSocketHandlers(io: Server): void {
  const userManager = new UserManager();
  const sessionManager = new SessionManager();

  function broadcastLobbyUpdate(): void {
    io.emit("lobbyUpdate", sessionManager.getOpenSessions());
  }

  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("setName", (name: string) => {
      if (userManager.hasUser(socket.id)) {
        return;
      }
      const user = userManager.addUser(socket.id, name);
      socket.emit("nameAssigned", user.displayName);
      socket.emit("lobbyUpdate", sessionManager.getOpenSessions());
    });

    socket.on(
      "createSession",
      (data: { gridSize: number; ships: ShipConfig[] }) => {
        const user = userManager.getUser(socket.id);
        if (!user) return;

        const existing = sessionManager.getWaitingSessionByCreator(socket.id);
        if (existing) return;

        const session = sessionManager.createSession(
          socket.id,
          user.displayName,
          data.gridSize,
          data.ships
        );

        socket.join(session.id);
        socket.emit("sessionCreated", { sessionId: session.id });
        broadcastLobbyUpdate();
      }
    );

    socket.on("cancelSession", () => {
      const removed = sessionManager.removeSessionsByCreator(socket.id);
      for (const id of removed) {
        socket.leave(id);
      }
      if (removed.length > 0) {
        broadcastLobbyUpdate();
      }
    });

    socket.on("joinSession", (sessionId: string) => {
      const user = userManager.getUser(socket.id);
      if (!user) return;

      const session = sessionManager.joinSession(
        sessionId,
        socket.id,
        user.displayName
      );
      if (!session) {
        socket.emit("joinFailed", "Session is no longer available.");
        return;
      }

      socket.join(session.id);

      io.to(session.id).emit("gameStarting", {
        sessionId: session.id,
        gridSize: session.gridSize,
        ships: session.ships,
        players: [
          { displayName: session.creatorDisplayName, socketId: session.creatorSocketId },
          { displayName: session.opponentDisplayName!, socketId: session.opponentSocketId! },
        ],
      });

      broadcastLobbyUpdate();
    });

    socket.on("submitPlacement", (data: PlayerPlacement) => {
      const result = sessionManager.setPlayerReady(
        data.sessionId,
        socket.id,
        data.placedShips
      );

      if (!result.success || !result.session) return;

      socket.emit("placementAccepted");

      if (result.session.creatorReady && result.session.opponentReady) {
        sessionManager.startBattle(result.session.id);
        io.to(result.session.id).emit("battleStart", {
          sessionId: result.session.id,
          players: [
            { displayName: result.session.creatorDisplayName, socketId: result.session.creatorSocketId },
            { displayName: result.session.opponentDisplayName!, socketId: result.session.opponentSocketId! },
          ],
          currentTurnSocketId: result.session.creatorSocketId,
        });
      }
    });

    socket.on("fireShot", async (data: ShotData) => {
      const result = sessionManager.fireShot(data.sessionId, socket.id, data.row, data.col);
      if (!result.success || !result.result || !result.session) return;

      io.to(result.session.id).emit("shotResult", result.result);

      if (result.result.gameOver) {
        const winnerName = result.session.creatorSocketId === result.result.winnerSocketId 
          ? result.session.creatorDisplayName 
          : result.session.opponentDisplayName!;
        const loserName = result.session.creatorSocketId === result.result.winnerSocketId 
          ? result.session.opponentDisplayName! 
          : result.session.creatorDisplayName;

        io.to(result.session.id).emit("gameOver", {
          winnerDisplayName: winnerName,
          loserDisplayName: loserName,
          reason: "victory"
        });
        sessionManager.removeSession(result.session.id);
        broadcastLobbyUpdate();

        await recordGameResult(winnerName, loserName);
        const newLeaderboard = await getLeaderboard();
        io.emit("leaderboardUpdate", newLeaderboard);
      }
    });

    socket.on("getLeaderboard", async () => {
      const lb = await getLeaderboard();
      socket.emit("leaderboardData", lb);
    });

    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);
      const user = userManager.getUser(socket.id);
      
      // Handle mid-game disconnects
      const activeSession = Array.from(sessionManager["sessions"].values()).find(s => 
        (s.creatorSocketId === socket.id || s.opponentSocketId === socket.id) && s.status === "active"
      );

      if (activeSession && user) {
        const winnerName = activeSession.creatorSocketId === socket.id 
          ? activeSession.opponentDisplayName! 
          : activeSession.creatorDisplayName;
        
        io.to(activeSession.id).emit("gameOver", {
          winnerDisplayName: winnerName,
          loserDisplayName: user.displayName,
          reason: "disconnect"
        });
        sessionManager.removeSession(activeSession.id);

        await recordGameResult(winnerName, user.displayName);
        const newLeaderboard = await getLeaderboard();
        io.emit("leaderboardUpdate", newLeaderboard);
      }

      userManager.removeUser(socket.id);
      const removed = sessionManager.removeSessionsByCreator(socket.id);
      if (removed.length > 0 || activeSession) {
        broadcastLobbyUpdate();
      }
    });
  });
}
