"use client";

import { Delete } from "lucide-react";
import { type LetterState } from "@/utils/evaluateWord";

interface KeyboardProps {
  onKey: (key: string) => void;
  keyboardColors: Record<string, LetterState>;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const stateColors: Record<LetterState, string> = {
  correct: "bg-[#538d4e] text-white border-[#538d4e]",
  present: "bg-[#b59f3b] text-white border-[#b59f3b]",
  absent: "bg-[#3a3a3c] text-white border-[#3a3a3c]",
};

export function Keyboard({ onKey, keyboardColors }: KeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-[6px] w-full max-w-[500px] px-1 sm:px-2">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-[6px] justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "BACKSPACE";
            const colorState = keyboardColors[key];
            const colorClass = colorState
              ? stateColors[colorState]
              : "bg-[#818384] text-white";

            return (
              <button
                key={key}
                onClick={() => onKey(key)}
                className={`${colorClass} ${
                  isSpecial ? "min-w-[52px] sm:min-w-[65px] px-1 sm:px-3 text-[10px] sm:text-xs" : "flex-1 max-w-[43px]"
                } h-[52px] sm:h-[58px] rounded font-bold uppercase flex items-center justify-center transition-colors duration-100 select-none active:scale-95`}
                aria-label={
                  key === "BACKSPACE"
                    ? "Borrar"
                    : key === "ENTER"
                    ? "Enviar"
                    : key
                }
              >
                {key === "BACKSPACE" ? (
                  <Delete className="w-5 h-5" />
                ) : key === "ENTER" ? (
                  "ENTER"
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
