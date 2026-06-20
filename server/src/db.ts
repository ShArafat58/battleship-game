import { Pool } from "pg";
import { PlayerStats } from "./types";
import dotenv from "dotenv";

dotenv.config();

let pool: Pool | null = null;

export function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL provided. Database features will be disabled.");
    return;
  }
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.query(`
    CREATE TABLE IF NOT EXISTS player_stats (
      name TEXT PRIMARY KEY,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0
    )
  `).catch(err => {
    console.error("Failed to initialize player_stats table:", err);
  });
}

export async function recordGameResult(winnerName: string, loserName: string): Promise<void> {
  if (!pool) return;

  try {
    await pool.query(`
      INSERT INTO player_stats (name, wins, losses, games_played)
      VALUES ($1, 1, 0, 1)
      ON CONFLICT (name) DO UPDATE SET 
        wins = player_stats.wins + 1,
        games_played = player_stats.games_played + 1
    `, [winnerName]);

    await pool.query(`
      INSERT INTO player_stats (name, wins, losses, games_played)
      VALUES ($1, 0, 1, 1)
      ON CONFLICT (name) DO UPDATE SET 
        losses = player_stats.losses + 1,
        games_played = player_stats.games_played + 1
    `, [loserName]);
  } catch (err) {
    console.error("Failed to record game result:", err);
  }
}

export async function getLeaderboard(): Promise<PlayerStats[]> {
  if (!pool) return [];

  try {
    const res = await pool.query(`
      SELECT name, wins, losses, games_played
      FROM player_stats
      ORDER BY wins DESC, games_played DESC
    `);
    
    return res.rows.map(row => ({
      name: row.name,
      wins: row.wins,
      losses: row.losses,
      gamesPlayed: row.games_played
    }));
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    return [];
  }
}
