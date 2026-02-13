"use client";

import { useEffect, useRef } from "react";
import { Tile } from "./Tile";
import { type LetterState } from "@/utils/evaluateWord";

interface BoardProps {
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  currentRow: number;
  revealingRow: number | null;
  onRevealComplete: () => void;
}

export function Board({
  guesses,
  evaluations,
  currentGuess,
  currentRow,
  revealingRow,
  onRevealComplete,
}: BoardProps) {
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (revealingRow !== null) {
      revealTimerRef.current = setTimeout(() => {
        onRevealComplete();
      }, 5 * 300 + 500);

      return () => {
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      };
    }
  }, [revealingRow, onRevealComplete]);

  const rows = [];

  for (let i = 0; i < 6; i++) {
    const tiles = [];

    if (i < guesses.length) {
      const guess = guesses[i];
      const evaluation = evaluations[i];
      const isRevealing = revealingRow === i;

      for (let j = 0; j < 5; j++) {
        tiles.push(
          <Tile
            key={j}
            letter={guess[j]}
            state={evaluation[j]}
            isRevealing={isRevealing}
            revealDelay={j * 300}
          />
        );
      }
    } else if (i === currentRow) {
      for (let j = 0; j < 5; j++) {
        tiles.push(
          <Tile
            key={j}
            letter={currentGuess[j] || ""}
            isCurrentRow={true}
          />
        );
      }
    } else {
      for (let j = 0; j < 5; j++) {
        tiles.push(<Tile key={j} letter="" />);
      }
    }

    rows.push(
      <div key={i} className="flex gap-1 sm:gap-[5px]">
        {tiles}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-[5px]">
      {rows}
    </div>
  );
}
