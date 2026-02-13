"use client";

import { type GameStatus } from "@/hooks/use-game";

interface GameOverProps {
  status: GameStatus;
  solution: string;
  onPlayAgain: () => void;
}

export function GameOver({ status, solution, onPlayAgain }: GameOverProps) {
  if (status === "playing") return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-4 w-full">
      {status === "won" ? (
        <p className="text-2xl sm:text-3xl font-bold text-white animate-bounce-once">
          {"GANASTE!"}
        </p>
      ) : (
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-white">
            PERDISTE
          </p>
          <p className="text-sm text-[#818384] mt-1">
            La palabra era: <strong className="text-white">{solution}</strong>
          </p>
        </div>
      )}
      <button
        onClick={onPlayAgain}
        className="px-8 py-3 bg-white text-[#121213] font-bold rounded hover:bg-[#e0e0e0] transition-colors text-sm"
      >
        Jugar de nuevo
      </button>
    </div>
  );
}
