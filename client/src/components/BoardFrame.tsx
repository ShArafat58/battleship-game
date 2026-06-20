import type { ReactNode } from "react";

interface BoardFrameProps {
    gridSize: number;
    children: ReactNode;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function BoardFrame({ gridSize, children }: BoardFrameProps) {
    return (
        <div className="board-with-coords">
            <div className="coord-corner" />
            <div
                className="coord-row-top"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
                {Array.from({ length: gridSize }).map((_, i) => (
                    <div key={i} className="coord-label">{LETTERS[i]}</div>
                ))}
            </div>
            <div
                className="coord-col-left"
                style={{ gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
            >
                {Array.from({ length: gridSize }).map((_, i) => (
                    <div key={i} className="coord-label">{i + 1}</div>
                ))}
            </div>
            {children}
        </div>
    );
}