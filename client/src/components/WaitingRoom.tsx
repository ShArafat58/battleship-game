import { socket } from "../socket";

interface WaitingRoomProps {
  onCancelled: () => void;
}

export function WaitingRoom({ onCancelled }: WaitingRoomProps) {
  const handleCancel = () => {
    socket.emit("cancelSession");
    onCancelled();
  };

  return (
    <div className="screen-center">
      <div className="card">
        <h2>Waiting for opponent…</h2>
        <div className="spinner"></div>
        <button onClick={handleCancel} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}
