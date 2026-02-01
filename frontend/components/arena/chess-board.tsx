"use client";

import { Chessboard } from "react-chessboard";
import { useState } from "react";

interface ChessBoardProps {
  /** When provided, the board is controlled and shows this FEN (enables auto-play from arena). */
  position?: string;
  onMove?: (move: { from: string; to: string }) => void;
}

export function ChessBoard({ position: controlledPosition, onMove }: ChessBoardProps) {
  const [internalPosition, setInternalPosition] = useState("start");
  const position = controlledPosition ?? internalPosition;

  // Custom square styles for Catppuccin theme
  const customSquareStyles = {
    lightSquareStyle: {
      backgroundColor: "hsl(237, 16.24%, 22.94%)", // surface0
    },
    darkSquareStyle: {
      backgroundColor: "hsl(240, 21%, 12%)", // darker mantle/crust
    },
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (onMove) {
      onMove({ from: sourceSquare, to: targetSquare });
    }
    if (controlledPosition == null) {
      setInternalPosition((prev) => prev); // no-op when uncontrolled; parent can pass new position
    }
    return true;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <Chessboard
        options={{
          position,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            targetSquare ? onDrop(sourceSquare, targetSquare) : true,
          lightSquareStyle: customSquareStyles.lightSquareStyle,
          darkSquareStyle: customSquareStyles.darkSquareStyle,
          boardOrientation: "white",
        }}
      />
    </div>
  );
}
