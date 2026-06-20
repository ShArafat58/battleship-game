import { useState, useEffect } from "react";
import type { BattleStartData, PlacedShip, ShotResultData } from "../types";
import { socket } from "../socket";

interface BattleProps {
  data: BattleStartData;
  initialShips: PlacedShip[];
  gridSize: number;
}

export function Battle({ data, initialShips, gridSize }: BattleProps) {
  const [currentTurnId, setCurrentTurnId] = useState(data.currentTurnSocketId);
  const [myShots, setMyShots] = useState<{ row: number; col: number; hit: boolean }[]>([]);
  const [opponentShots, setOpponentShots] = useState<{ row: number; col: number; hit: boolean }[]>([]);
  const [opponentSunkShips, setOpponentSunkShips] = useState<PlacedShip[]>([]);

  useEffect(() => {
    const onShotResult = (result: ShotResultData) => {
      if (currentTurnId === socket.id) {
        // I fired this shot
        setMyShots((prev) => [...prev, { row: result.row, col: result.col, hit: result.hit }]);
        if (result.sunkShip) {
          setOpponentSunkShips((prev) => [...prev, result.sunkShip!]);
        }
      } else {
        // Opponent fired this shot
        setOpponentShots((prev) => [...prev, { row: result.row, col: result.col, hit: result.hit }]);
      }
      setCurrentTurnId(result.nextTurnSocketId);
    };

    socket.on("shotResult", onShotResult);
    return () => {
      socket.off("shotResult", onShotResult);
    };
  }, [currentTurnId]);

  const isMyTurn = currentTurnId === socket.id;

  const handleFire = (row: number, col: number) => {
    if (!isMyTurn) return;
    if (myShots.some((s) => s.row === row && s.col === col)) return; // already fired here

    socket.emit("fireShot", {
      sessionId: data.sessionId,
      row,
      col,
    });
  };

  const getHoverCells = (row: number, col: number, size: number, orient: "horizontal" | "vertical") => {
    const cells = [];
    for (let i = 0; i < size; i++) {
      if (orient === "horizontal") {
        cells.push({ row, col: col + i });
      } else {
        cells.push({ row: row + i, col });
      }
    }
    return cells;
  };

  // Helper to check if one of my ships is sunk based on opponentShots
  const getMySunkShipsCount = () => {
    let sunkCount = 0;
    for (const ship of initialShips) {
      const cells = getHoverCells(ship.row, ship.col, ship.size, ship.orientation);
      const isSunk = cells.every((c) => opponentShots.some((s) => s.hit && s.row === c.row && s.col === c.col));
      if (isSunk) sunkCount++;
    }
    return sunkCount;
  };

  return (
    <div className="battle-screen">
      <div className={`status-banner ${isMyTurn ? "my-turn" : "opponent-turn"}`}>
        {isMyTurn ? "Your turn — fire!" : "Opponent's turn — waiting..."}
      </div>

      <div className="battle-boards-container">
        {/* Your Board */}
        <div className="board-section">
          <h3>Your Board</h3>
          <div className="fleet-status">
            Ships Remaining: {initialShips.length - getMySunkShipsCount()} / {initialShips.length}
          </div>
          <div
            className="board"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {Array.from({ length: gridSize }).map((_, row) =>
              Array.from({ length: gridSize }).map((_, col) => {
                const isShip = initialShips.some((ship) =>
                  getHoverCells(ship.row, ship.col, ship.size, ship.orientation).some(
                    (c) => c.row === row && c.col === col
                  )
                );
                const shot = opponentShots.find((s) => s.row === row && s.col === col);

                let cellClass = "board-cell";
                if (isShip) cellClass += " placed";
                if (shot) {
                  cellClass += shot.hit ? " shot-hit" : " shot-miss";
                }

                return <div key={`my-${row}-${col}`} className={cellClass} />;
              })
            )}
          </div>
        </div>

        {/* Opponent's Board */}
        <div className="board-section">
          <h3>Opponent's Board</h3>
          <div className="fleet-status">
            Enemy Ships Sunk: {opponentSunkShips.length} / {initialShips.length}
          </div>
          <div
            className={`board firing-board ${isMyTurn ? "active" : ""}`}
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {Array.from({ length: gridSize }).map((_, row) =>
              Array.from({ length: gridSize }).map((_, col) => {
                const shot = myShots.find((s) => s.row === row && s.col === col);
                const isSunkShipCell = opponentSunkShips.some((ship) =>
                  getHoverCells(ship.row, ship.col, ship.size, ship.orientation).some(
                    (c) => c.row === row && c.col === col
                  )
                );

                let cellClass = "board-cell clickable";
                if (shot) {
                  cellClass += shot.hit ? " shot-hit" : " shot-miss";
                }
                if (isSunkShipCell) {
                  cellClass += " sunk-ship";
                }

                return (
                  <div
                    key={`opp-${row}-${col}`}
                    className={cellClass}
                    onClick={() => handleFire(row, col)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
