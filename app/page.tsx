"use client";

import { useState, useEffect } from "react";
import { Board } from "@/components/wordle/Board";
import { Keyboard } from "@/components/wordle/Keyboard";
import { Tutorial } from "@/components/wordle/Tutorial";
import { Toast } from "@/components/wordle/Toast";
import { useGame } from "@/hooks/use-game";
import { Flame, Menu } from "lucide-react";
import SidebarMenu from "@/components/wordle/SideBarMenu";

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);

  const game = useGame();

  useEffect(() => {
    setMounted(true);
    const hasSeenTutorial = localStorage.getItem("wordle-tutorial-seen");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("wordle-tutorial-seen", "true");
  };

  if (!mounted) {
    return (
      <div className="h-dvh bg-[#121213] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#538d4e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="h-dvh bg-[#121213] flex flex-col items-center relative select-none overflow-hidden">
      <header className="w-full border-b border-[#3a3a3c] py-2 sm:py-3 flex items-center justify-center shrink-0">
        <button
          className="absolute left-4 text-[#818384] hover:text-white transition-colors"
          type="button"
          onClick={() => setOpenSidebar(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white">
            WORDLE
          </h1>
          <span className="text-[10px] sm:text-xs text-[#538d4e] font-medium tracking-wider uppercase">
            {game.gameMode === "daily" ? "Palabra del dia" : "Solitario"}
          </span>
          <div className="flex items-center gap-1 text-[#ac461d]" title={game.gameMode === "daily" ? "Racha diaria" : "Racha solitario"}>
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-bold tabular-nums">
              {game.gameMode === "daily" ? (game.streaks?.dailyStreak ?? 0) : (game.streaks?.solitaireStreak ?? 0)}
            </span>
          </div>
        </div>
      </header>

      <SidebarMenu
        open={openSidebar}
        onOpenChange={setOpenSidebar}
        onTutorial={() => setShowTutorial(true)}
        onDailyWord={game.startDailyGame}
        onSolitaire={game.resetGame}
      />

      <Toast message={game.toastMessage} />

      <div className="flex-1 flex flex-col items-center py-2 sm:py-4 gap-2 sm:gap-4 w-full max-w-lg min-h-0">
        <div className="flex flex-col p-10 items-center sm:gap-4 justify-center min-h-0">
          <Board
            guesses={game.guesses}
            evaluations={game.evaluations}
            currentGuess={game.currentGuess}
            currentRow={game.currentRow}
            revealingRow={game.revealingRow}
            onRevealComplete={game.finishReveal}
          />
        </div>

        {game.gameStatus !== "playing" && (
          <div className="flex justify-center">
            <button
              onClick={game.gameMode === "daily" ? game.resetGame : game.resetGame}
              className="px-6 py-3 bg-white text-[#121213] font-bold rounded hover:bg-[#e0e0e0] transition-colors text-sm"
            >
              {game.gameMode === "daily" ? "Jugar solitario" : "Jugar de nuevo"}
            </button>
          </div>
        )}

        <div className="w-full shrink-0 pb-[env(safe-area-inset-bottom)]">
          <Keyboard
            onKey={game.handleKeyPress}
            keyboardColors={game.keyboardColors}
          />
        </div>
      </div>

      {showTutorial && <Tutorial onClose={handleCloseTutorial} />}
    </main>
  );
}
