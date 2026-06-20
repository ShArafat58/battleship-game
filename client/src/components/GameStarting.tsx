import type { GameStartingData } from "../types";

interface GameStartingProps {
  data: GameStartingData;
}

export function GameStarting({ data }: GameStartingProps) {
  return (
    <div className="screen-center">
      <div className="card">
        <h2>Game Starting!</h2>
        <p>
          {data.players[0].displayName} vs {data.players[1].displayName}
        </p>
        <p>Grid: {data.gridSize}×{data.gridSize}</p>
        <p>Ships: {data.ships.map((s) => `${s.name} (${s.size})`).join(", ")}</p>
        <div className="spinner"></div>
        <p className="muted">Game board coming in a future phase…</p>
      </div>
    </div>
  );
}
