import { useState, useEffect } from "react";
import type { GameStartingData, PlacedShip, ShipConfig } from "../types";
import { socket } from "../socket";

interface ShipPlacementProps {
  data: GameStartingData;
}

export function ShipPlacement({ data }: ShipPlacementProps) {
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [selectedShipIndex, setSelectedShipIndex] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Keyboard shortcut for rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        setOrientation((prev) => (prev === "horizontal" ? "vertical" : "horizontal"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unplacedShips = data.ships.map((s, i) => ({ ...s, originalIndex: i })).filter(
    (s) => !placedShips.some((ps) => ps.name === s.name && ps.size === s.size && data.ships.indexOf(s) === s.originalIndex)
    // Actually we need to uniquely identify ships since there could be duplicates.
    // So let's base it purely on the index in data.ships.
  );
  
  // A safer unplaced logic relying on index
  const availableShips = data.ships.map((ship, index) => {
    const placed = placedShips.find((ps) => ps.name === ship.name && ps.size === ship.size && (ps as any)._index === index);
    return { ship, index, isPlaced: !!placed };
  });

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

  const isPlacementValid = (row: number, col: number, size: number, orient: "horizontal" | "vertical", ignoreIndex?: number) => {
    const cells = getHoverCells(row, col, size, orient);
    
    // Bounds check
    if (cells.some((c) => c.row < 0 || c.row >= data.gridSize || c.col < 0 || c.col >= data.gridSize)) {
      return false;
    }

    // Overlap check
    for (const cell of cells) {
      if (
        placedShips.some(
          (ps) =>
            (ps as any)._index !== ignoreIndex &&
            getHoverCells(ps.row, ps.col, ps.size, ps.orientation).some(
              (pc) => pc.row === cell.row && pc.col === cell.col
            )
        )
      ) {
        return false;
      }
    }

    return true;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isReady) return;

    if (selectedShipIndex !== null) {
      const shipToPlace = availableShips.find(s => s.index === selectedShipIndex)?.ship;
      if (!shipToPlace) return;

      if (isPlacementValid(row, col, shipToPlace.size, orientation)) {
        setPlacedShips((prev) => [
          ...prev,
          { ...shipToPlace, row, col, orientation, _index: selectedShipIndex } as any
        ]);
        setSelectedShipIndex(null);
      }
    } else {
      // Check if clicking on an already placed ship to pick it up
      const clickedShip = placedShips.find((ps) =>
        getHoverCells(ps.row, ps.col, ps.size, ps.orientation).some(
          (c) => c.row === row && c.col === col
        )
      );
      if (clickedShip) {
        setPlacedShips((prev) => prev.filter((s) => s !== clickedShip));
        setSelectedShipIndex((clickedShip as any)._index);
        setOrientation(clickedShip.orientation);
      }
    }
  };

  const handleRandomize = () => {
    if (isReady) return;
    let currentPlaced: any[] = [];
    
    for (let i = 0; i < data.ships.length; i++) {
      const ship = data.ships[i];
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        const orient = Math.random() > 0.5 ? "horizontal" : "vertical";
        const row = Math.floor(Math.random() * data.gridSize);
        const col = Math.floor(Math.random() * data.gridSize);

        const cells = getHoverCells(row, col, ship.size, orient);
        
        const inBounds = cells.every(c => c.row >= 0 && c.row < data.gridSize && c.col >= 0 && c.col < data.gridSize);
        if (!inBounds) {
          attempts++;
          continue;
        }

        const overlap = cells.some(c => 
          currentPlaced.some(ps => 
            getHoverCells(ps.row, ps.col, ps.size, ps.orientation).some(pc => pc.row === c.row && pc.col === c.col)
          )
        );

        if (!overlap) {
          currentPlaced.push({ ...ship, row, col, orientation: orient, _index: i });
          placed = true;
        }
        attempts++;
      }
    }
    setPlacedShips(currentPlaced);
    setSelectedShipIndex(null);
  };

  const handleSubmit = () => {
    if (placedShips.length !== data.ships.length) return;
    setIsReady(true);
    socket.emit("submitPlacement", {
      sessionId: data.sessionId,
      // Strip internal _index property
      placedShips: placedShips.map(({ _index, ...rest }: any) => rest),
    });
  };

  const allPlaced = placedShips.length === data.ships.length;

  return (
    <div className="placement-screen">
      <div className="placement-header">
        <h2>Place Your Fleet</h2>
        {isReady && <span className="status-badge waiting">Waiting for opponent…</span>}
      </div>

      <div className="placement-content">
        <div className="board-container">
          <div
            className="board"
            style={{
              gridTemplateColumns: `repeat(${data.gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${data.gridSize}, 1fr)`,
            }}
            onMouseLeave={() => setHoverCell(null)}
          >
            {Array.from({ length: data.gridSize }).map((_, row) =>
              Array.from({ length: data.gridSize }).map((_, col) => {
                let isHovered = false;
                let isValidHover = false;
                let isPlacedHere = false;

                if (hoverCell && selectedShipIndex !== null) {
                  const ship = availableShips.find(s => s.index === selectedShipIndex)?.ship;
                  if (ship) {
                    const hCells = getHoverCells(hoverCell.row, hoverCell.col, ship.size, orientation);
                    if (hCells.some((c) => c.row === row && c.col === col)) {
                      isHovered = true;
                      isValidHover = isPlacementValid(hoverCell.row, hoverCell.col, ship.size, orientation);
                    }
                  }
                }

                if (!isHovered) {
                  isPlacedHere = placedShips.some((ps) =>
                    getHoverCells(ps.row, ps.col, ps.size, ps.orientation).some(
                      (c) => c.row === row && c.col === col
                    )
                  );
                }

                let cellClass = "board-cell";
                if (isHovered) cellClass += isValidHover ? " hover-valid" : " hover-invalid";
                if (isPlacedHere) cellClass += " placed";

                return (
                  <div
                    key={`${row}-${col}`}
                    className={cellClass}
                    onMouseEnter={() => setHoverCell({ row, col })}
                    onClick={() => handleCellClick(row, col)}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="placement-sidebar">
          <div className="controls">
            <button
              onClick={() => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
              disabled={isReady || selectedShipIndex === null}
            >
              Rotate (R) [{orientation}]
            </button>
            <button onClick={() => setPlacedShips([])} disabled={isReady || placedShips.length === 0}>
              Reset All
            </button>
            <button onClick={handleRandomize} disabled={isReady}>
              Randomize
            </button>
          </div>

          <div className="ship-list-container">
            <h3>Ships</h3>
            <ul className="ship-selection-list">
              {availableShips.map(({ ship, index, isPlaced }) => (
                <li
                  key={index}
                  className={`ship-item ${isPlaced ? "placed" : ""} ${
                    selectedShipIndex === index ? "selected" : ""
                  }`}
                  onClick={() => {
                    if (!isReady && !isPlaced) {
                      setSelectedShipIndex(index);
                    }
                  }}
                >
                  {ship.name} ({ship.size})
                </li>
              ))}
            </ul>
          </div>

          <button
            className="ready-btn"
            onClick={handleSubmit}
            disabled={!allPlaced || isReady}
          >
            {isReady ? "Ready!" : "Ready"}
          </button>
        </div>
      </div>
    </div>
  );
}
