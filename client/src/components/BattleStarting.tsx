import type { BattleStartData } from "../types";

interface BattleStartingProps {
  data: BattleStartData;
}

export function BattleStarting({ data }: BattleStartingProps) {
  return (
    <div className="screen-center">
      <div className="card text-center">
        <h2>Battle is Starting!</h2>
        <div className="vs-container">
          <h3 className="player-name-large">{data.players[0]?.displayName}</h3>
          <span className="vs-text">VS</span>
          <h3 className="player-name-large">{data.players[1]?.displayName}</h3>
        </div>
        <div className="spinner mt-4"></div>
        <p className="muted mt-4">The battle board is coming in the next phase...</p>
      </div>
    </div>
  );
}
