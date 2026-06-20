import type { GameOverData } from "../types";

interface GameOverProps {
  data: GameOverData;
  onReturnToLobby: () => void;
}

export function GameOver({ data, onReturnToLobby }: GameOverProps) {
  return (
    <div className="screen-center">
      <div className="card text-center">
        <h2>{data.reason === "disconnect" ? "Opponent Disconnected" : "Game Over"}</h2>
        <div className="vs-container" style={{ flexDirection: "column", gap: "1rem" }}>
          <h3 className="player-name-large" style={{ color: "#28a745" }}>Winner: {data.winnerDisplayName}</h3>
          <h3 className="player-name-large" style={{ color: "#dc3545" }}>Defeated: {data.loserDisplayName}</h3>
        </div>
        <button className="mt-4" onClick={onReturnToLobby}>Return to Lobby</button>
      </div>
    </div>
  );
}
