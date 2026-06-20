import { useState } from "react";
import { socket } from "../socket";

interface NameEntryProps {
  onNameAssigned: (name: string) => void;
}

export function NameEntry({ onNameAssigned }: NameEntryProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    socket.once("nameAssigned", (displayName: string) => {
      onNameAssigned(displayName);
    });

    socket.emit("setName", name.trim());
  };

  return (
    <div className="screen-center">
      <div className="card">
        <div className="logo-anchor">⚓</div>
        <h1>Battleship</h1>
        <p className="tagline">NAVAL COMBAT • REAL-TIME MULTIPLAYER</p>
        <form onSubmit={handleSubmit}>
          <input
            id="name-input"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            disabled={submitting}
          />
          <button id="enter-btn" type="submit" disabled={!name.trim() || submitting}>
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
