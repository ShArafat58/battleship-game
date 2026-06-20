import type { GameOverData } from "../types";

interface GameOverProps {
  data: GameOverData;
  myName: string;
  onReturnToLobby: () => void;
}

export function GameOver({ data, myName, onReturnToLobby }: GameOverProps) {
  const isWinner = data.winnerDisplayName === myName;
  const isDisconnect = data.reason === "disconnect";

  return (
    <div className="screen-center">
      <div className={`card game-over ${isWinner ? "victory" : "defeat"}`}>
        <div className="game-over-icon">{isWinner ? "★" : "☓"}</div>
        <h1 className="game-over-title">{isWinner ? "VICTORY" : "DEFEAT"}</h1>

        {isDisconnect && (
          <p className="muted">
            {isWinner ? "Your opponent left the battle." : "You left the battle."}
          </p>
        )}

        <div className="game-over-result">
          <div className="result-row winner-row">
            <span className="result-label">Winner</span>
            <span className="result-name">{data.winnerDisplayName}</span>
          </div>
          <div className="result-row loser-row">
            <span className="result-label">Defeated</span>
            <span className="result-name">{data.loserDisplayName}</span>
          </div>
        </div>

        <button className="mt-4" onClick={onReturnToLobby}>
          Return to Lobby
        </button>
      </div>
    </div>
  );
}