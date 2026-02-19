"use client";

import { type GameStatus } from "@/hooks/use-game";

interface GameOverProps {
  status: GameStatus;
  solution: string;
  onPlayAgain: () => void;
}

export function GameOver({ status, solution, onPlayAgain }: GameOverProps) {
  if (status === "playing") return null;

  const isWon = status === "won";

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-[#121213] border border-[#3a3a3c] rounded-xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center">
          {isWon ? (
            <p className="text-2xl sm:text-3xl font-bold text-white">
              ¡GANASTE!
            </p>
          ) : (
            <>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                PERDISTE
              </p>
              <p className="text-sm text-[#818384]">
                La palabra era:{" "}
                <strong className="text-white">{solution}</strong>
              </p>
            </>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-white text-[#121213] font-bold rounded hover:bg-[#e0e0e0] transition-colors text-sm"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

