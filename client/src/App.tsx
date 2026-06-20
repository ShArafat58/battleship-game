import { useEffect, useState } from "react";
import { socket } from "./socket";
import { NameEntry } from "./components/NameEntry";
import { CreateGameForm } from "./components/CreateGameForm";
import { WaitingRoom } from "./components/WaitingRoom";
import { GameStarting } from "./components/GameStarting";
import type { LobbySession, GameStartingData } from "./types";

type Screen = "name" | "lobby" | "creating" | "waiting" | "starting";

function App() {
  const [screen, setScreen] = useState<Screen>("name");
  const [displayName, setDisplayName] = useState("");
  const [sessions, setSessions] = useState<LobbySession[]>([]);
  const [gameData, setGameData] = useState<GameStartingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onLobbyUpdate = (list: LobbySession[]) => setSessions(list);
    const onSessionCreated = () => setScreen("waiting");
    const onGameStarting = (data: GameStartingData) => {
      setGameData(data);
      setScreen("starting");
    };
    const onJoinFailed = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    };

    socket.on("lobbyUpdate", onLobbyUpdate);
    socket.on("sessionCreated", onSessionCreated);
    socket.on("gameStarting", onGameStarting);
    socket.on("joinFailed", onJoinFailed);

    return () => {
      socket.off("lobbyUpdate", onLobbyUpdate);
      socket.off("sessionCreated", onSessionCreated);
      socket.off("gameStarting", onGameStarting);
      socket.off("joinFailed", onJoinFailed);
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

  if (screen === "starting" && gameData) {
    return <GameStarting data={gameData} />;
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