import { useState } from "react";
import type { ShipConfig } from "../types";
import { DEFAULT_SHIPS, GRID_PRESETS } from "../types";
import { socket } from "../socket";

interface CreateGameFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

export function CreateGameForm({ onCreated, onCancel }: CreateGameFormProps) {
  const [gridSize, setGridSize] = useState(10);
  const [ships, setShips] = useState<ShipConfig[]>(() =>
    DEFAULT_SHIPS.map((s) => ({ ...s }))
  );

  const totalShipCells = ships.reduce((sum, s) => sum + s.size, 0);
  const maxCells = gridSize * gridSize;

  const handleAddShip = () => {
    setShips([...ships, { name: "Ship", size: 2 }]);
  };

  const handleRemoveShip = (index: number) => {
    setShips(ships.filter((_, i) => i !== index));
  };

  const handleShipName = (index: number, value: string) => {
    setShips(ships.map((s, i) => (i === index ? { ...s, name: value } : s)));
  };

  const handleShipSize = (index: number, value: string) => {
    setShips(ships.map((s, i) => (i === index ? { ...s, size: Number(value) } : s)));
  };

  const isValid = ships.length >= 1 && totalShipCells <= maxCells && ships.every((s) => s.size >= 1 && s.size <= gridSize);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    socket.emit("createSession", { gridSize, ships });
    onCreated();
  };

  return (
    <div className="card create-form">
      <h2>Create Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Grid Size</label>
          <div className="grid-presets">
            {GRID_PRESETS.map((size) => (
              <button
                key={size}
                type="button"
                className={gridSize === size ? "active" : ""}
                onClick={() => setGridSize(size)}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Ships ({totalShipCells}/{maxCells} cells)</label>
          <div className="ship-list">
            {ships.map((ship, i) => (
              <div key={i} className="ship-row">
                <input
                  type="text"
                  value={ship.name}
                  onChange={(e) => handleShipName(i, e.target.value)}
                  placeholder="Name"
                  className="ship-name-input"
                />
                <input
                  type="number"
                  value={ship.size}
                  onChange={(e) => handleShipSize(i, e.target.value)}
                  min={1}
                  max={gridSize}
                  className="ship-size-input"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveShip(i)}
                  className="remove-btn"
                  disabled={ships.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddShip} className="add-ship-btn">
            + Add Ship
          </button>
        </div>

        {!isValid && totalShipCells > maxCells && (
          <p className="error-text">Too many ship cells for grid size.</p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={!isValid}>
            Create
          </button>
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
