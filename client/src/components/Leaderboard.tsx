import type { PlayerStats } from "../types";

interface LeaderboardProps {
  stats: PlayerStats[];
}

export function Leaderboard({ stats }: LeaderboardProps) {
  return (
    <div className="leaderboard-panel">
      <h2>Leaderboard</h2>
      {stats.length === 0 && <p className="muted">No stats recorded yet.</p>}
      {stats.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Played</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, idx) => (
              <tr key={s.name}>
                <td className="rank">#{idx + 1}</td>
                <td className="player-name-cell">{s.name}</td>
                <td className="wins-cell">{s.wins}</td>
                <td className="losses-cell">{s.losses}</td>
                <td>{s.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
