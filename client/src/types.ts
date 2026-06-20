export interface ShipConfig {
  name: string;
  size: number;
}

export interface PlacedShip {
  name: string;
  size: number;
  row: number;
  col: number;
  orientation: "horizontal" | "vertical";
}

export interface PlayerPlacement {
  sessionId: string;
  placedShips: PlacedShip[];
}

export interface BattleStartData {
  sessionId: string;
  players: { displayName: string; socketId: string }[];
  currentTurnSocketId: string;
}

export interface ShotData {
  sessionId: string;
  row: number;
  col: number;
}

export interface ShotResultData {
  row: number;
  col: number;
  hit: boolean;
  sunkShip?: PlacedShip;
  nextTurnSocketId: string;
  gameOver?: boolean;
  winnerSocketId?: string;
}

export interface GameOverData {
  winnerDisplayName: string;
  loserDisplayName: string;
  reason?: "disconnect" | "victory";
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export interface LobbySession {
  id: string;
  creatorDisplayName: string;
  gridSize: number;
  ships: ShipConfig[];
}

export interface GameStartingData {
  sessionId: string;
  gridSize: number;
  ships: ShipConfig[];
  players: { displayName: string; socketId: string }[];
}

export const DEFAULT_SHIPS: ShipConfig[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

export const GRID_PRESETS = [8, 10, 12];
