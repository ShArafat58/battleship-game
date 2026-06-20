import { useEffect, useState } from "react";
import { socket } from "./socket";
import { NameEntry } from "./components/NameEntry";
import { CreateGameForm } from "./components/CreateGameForm";
import { WaitingRoom } from "./components/WaitingRoom";
import { ShipPlacement } from "./components/ShipPlacement";
import { Battle } from "./components/Battle";
import { GameOver } from "./components/GameOver";
import type { LobbySession, GameStartingData, BattleStartData, PlacedShip, GameOverData } from "./types";

type Screen = "name" | "lobby" | "creating" | "waiting" | "placement" | "battle" | "game_over";

function App() {
  const [screen, setScreen] = useState<Screen>("name");
  const [displayName, setDisplayName] = useState("");
  const [sessions, setSessions] = useState<LobbySession[]>([]);
  const [gameData, setGameData] = useState<GameStartingData | null>(null);
  const [battleData, setBattleData] = useState<BattleStartData | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [myPlacedShips, setMyPlacedShips] = useState<PlacedShip[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const onLobbyUpdate = (list: LobbySession[]) => setSessions(list);
    const onSessionCreated = () => setScreen("waiting");
    const onGameStarting = (data: GameStartingData) => {
      setGameData(data);
      // Skip the starting screen and go straight to placement
      setScreen("placement");
    };
    const onJoinFailed = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    };
    const onBattleStart = (data: BattleStartData) => {
      setBattleData(data);
      setScreen("battle");
    };
    const onGameOver = (data: GameOverData) => {
      setGameOverData(data);
      setScreen("game_over");
    };

    socket.on("lobbyUpdate", onLobbyUpdate);
    socket.on("sessionCreated", onSessionCreated);
    socket.on("gameStarting", onGameStarting);
    socket.on("joinFailed", onJoinFailed);
    socket.on("battleStart", onBattleStart);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("lobbyUpdate", onLobbyUpdate);
      socket.off("sessionCreated", onSessionCreated);
      socket.off("gameStarting", onGameStarting);
      socket.off("joinFailed", onJoinFailed);
      socket.off("battleStart", onBattleStart);
      socket.off("gameOver", onGameOver);
    };
  }, []);

  const handleNameAssigned = (name: string) => {
    setDisplayName(name);
    setScreen("lobby");
  };

  const handleJoin = (sessionId: string) => {
    socket.emit("joinSession", sessionId);
  };

  if (screen === "name") {
    return <NameEntry onNameAssigned={handleNameAssigned} />;
  }

  if (screen === "creating") {
    return (
      <CreateGameForm
        onCreated={() => setScreen("waiting")}
        onCancel={() => setScreen("lobby")}
      />
    );
  }

  if (screen === "waiting") {
    return <WaitingRoom onCancelled={() => setScreen("lobby")} />;
  }

  if (screen === "placement" && gameData) {
    return <ShipPlacement data={gameData} onSubmitted={(ships) => setMyPlacedShips(ships)} />;
  }

  if (screen === "battle" && battleData && gameData) {
    return <Battle data={battleData} initialShips={myPlacedShips} gridSize={gameData.gridSize} />;
  }

  if (screen === "game_over" && gameOverData) {
    return (
      <GameOver
        data={gameOverData}
        onReturnToLobby={() => {
          setGameData(null);
          setBattleData(null);
          setGameOverData(null);
          setMyPlacedShips([]);
          setScreen("lobby");
        }}
      />
    );
  }

  return (
    <div className="lobby">
      <header className="lobby-header">
        <h1>Battleship</h1>
        <span className="player-name">Playing as: {displayName}</span>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="lobby-actions">
        <button onClick={() => setScreen("creating")}>+ Create Game</button>
      </div>

      <div className="session-list">
        <h2>Open Games</h2>
        {sessions.length === 0 && <p className="muted">No open games. Create one!</p>}
        {sessions.map((s) => (
          <div key={s.id} className="session-row">
            <div className="session-info">
              <strong>{s.creatorDisplayName}</strong>
              <span>{s.gridSize}×{s.gridSize}</span>
              <span>{s.ships.length} ships</span>
            </div>
            <button onClick={() => handleJoin(s.id)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;