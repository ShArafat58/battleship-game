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
}

export interface User {
  socketId: string;
  displayName: string;
}

export interface GameSession {
  id: string;
  creatorSocketId: string;
  creatorDisplayName: string;
  gridSize: number;
  ships: ShipConfig[];
  opponentSocketId: string | null;
  opponentDisplayName: string | null;
  status: "waiting" | "active";
  creatorReady: boolean;
  creatorShips?: PlacedShip[];
  opponentReady: boolean;
  opponentShips?: PlacedShip[];
}

export interface LobbySession {
  id: string;
  creatorDisplayName: string;
  gridSize: number;
  ships: ShipConfig[];
}

export const DEFAULT_SHIPS: ShipConfig[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

export const GRID_PRESETS = [8, 10, 12];
