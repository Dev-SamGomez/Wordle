"use client";

import { type Evaluation } from "@/hooks/use-game";
import { Tile } from "./Tile";
import { useEffect, useRef } from "react";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

interface BoardProps {
  guesses: string[];
  evaluations: Evaluation[][];
  currentGuess: string;
  currentRow: number;
  revealingRow: number | null;
  onRevealComplete: () => void;
}

function getColor(evaluation: Evaluation): string {
  switch (evaluation) {
    case "correct":
      return "bg-[#538d4e] border-[#538d4e]";
    case "present":
      return "bg-[#b59f3b] border-[#b59f3b]";
    case "absent":
      return "bg-[#3a3a3c] border-[#3a3a3c]";
  }
}

export function Board({
  guesses,
  evaluations,
  currentGuess,
  currentRow,
  revealingRow,
  onRevealComplete,
}: BoardProps) {

  const firedForRowRef = useRef<number | null>(null);

  useEffect(() => {
    if (revealingRow === null) {
      firedForRowRef.current = null;
      return;
    }
    if (firedForRowRef.current === revealingRow) return;
    firedForRowRef.current = revealingRow;

    const totalMs = (WORD_LENGTH - 1) * 350 + 500;
    const timer = window.setTimeout(() => {
      onRevealComplete();
    }, totalMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [revealingRow, onRevealComplete]);

  const rows = [];

  for (let i = 0; i < MAX_GUESSES; i++) {
    const cells = [];

    for (let j = 0; j < WORD_LENGTH; j++) {
      let letter = "";
      let cellClass =
        "w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white uppercase transition-all duration-200";

      if (i < guesses.length) {
        letter = guesses[i][j];
        const isRevealing = revealingRow === i;
        const colorClass = getColor(evaluations[i][j]);

        if (isRevealing) {
          cellClass += ` border-[#3a3a3c] ${colorClass}`;
          cellClass += " animate-flip";
        } else {
          cellClass += ` ${colorClass}`;
        }
      } else if (i === currentRow) {
        letter = currentGuess[j] || "";
        cellClass += letter
          ? " border-[#565758] scale-105"
          : " border-[#3a3a3c]";
      } else {
        cellClass += " border-[#3a3a3c]";
      }

      cells.push(
        <Tile
          key={`${i}-${j}`}
          letter={letter}
          state={i < guesses.length ? evaluations[i][j] : undefined}
          isRevealing={revealingRow === i}
          revealDelay={j * 350}
          isCurrentRow={i === currentRow}
        />
      );
    }

    rows.push(
      <div key={i} className="flex gap-1.5">
        {cells}
      </div>
    );
  }

  return <div className="flex flex-col gap-1.5">{rows}</div>;
}
