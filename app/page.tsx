"use client";

import { useState, useEffect } from "react";
import { Board } from "@/components/wordle/Board";
import { Keyboard } from "@/components/wordle/Keyboard";
import { Tutorial } from "@/components/wordle/Tutorial";
import { Toast } from "@/components/wordle/Toast";
import { useGame } from "@/hooks/use-game";
import { Flame, Menu } from "lucide-react";
import SidebarMenu from "@/components/wordle/SideBarMenu";
import MultiplayerHome from "@/components/multiplayer/multiplayer-home";
import MainScreen from "@/components/main";
import CompetitiveRecord from "@/components/wordle/HistoryCompetitive";

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showHistoryCompetitive, setShowHistoryCompetitive] = useState(false);
  const [showMainScreen, setShowMainScreen] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);

  const game = useGame();
  const cups = game.getCompetitiveCups();

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

  const handleCloseHistoryCompetitive = () => {
    setShowHistoryCompetitive(false);
  };

  const handleMultiPlayer = () => {
    if (showMainScreen) setShowMainScreen(prev => !prev)
    game.multiplayerMode()
    setShowMultiplayer(true)
  }

  const handleSolitarie = () => {
    if (showMainScreen) setShowMainScreen(prev => !prev)
    game.resetGame()
    if (showMultiplayer) setShowMultiplayer(prev => !prev)
  }

  const handleWordDay = () => {
    if (showMainScreen) setShowMainScreen(prev => !prev)
    game.startDailyGame()
    if (showMultiplayer) setShowMultiplayer(prev => !prev)
  }

  const handleHistoryCompetitive = () => {
    setShowHistoryCompetitive(true)
  }

  if (!mounted) {
    return (
      <div className="h-dvh bg-[#121213] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#538d4e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="h-dvh bg-[#121213] flex flex-col items-center relative select-none overflow-hidden">

      <button
        className="absolute py-2 sm:py-3 left-4 text-[#818384] hover:text-white transition-colors"
        type="button"
        onClick={() => setOpenSidebar(true)}
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {!showMainScreen && (
        <>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white">
              WORDLE
            </h1>
            <span className="text-[10px] sm:text-xs text-[#538d4e] font-medium tracking-wider uppercase">
              {game.gameMode === "multiplayer" ? "competitivo" : game.gameMode === "daily" ? "Palabra del dia" : "Solitario"}
            </span>
            <div className="flex items-center gap-1 text-[#ac461d]" title={game.gameMode === "multiplayer" ? "" : game.gameMode === "daily" ? "Racha Diaria" : "Racha Solitario"}>
              {
                game.gameMode != "multiplayer" && (
                  <>
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-bold tabular-nums">
                      {game.gameMode === "daily" ? (game.streaks?.dailyStreak ?? 0) : (game.streaks?.solitaireStreak ?? 0)}
                    </span>
                  </>
                )
              }
            </div>
          </div>
        </>
      )}

      <SidebarMenu
        open={openSidebar}
        onOpenChange={setOpenSidebar}
        onShowMain={() => setShowMainScreen(true)}
        onTutorial={() => setShowTutorial(true)}
        onDailyWord={handleWordDay}
        onSolitaire={handleSolitarie}
        onMultiplayer={handleMultiPlayer}
        onCompetitiveRecord={handleHistoryCompetitive}
        cups={cups}
        streakDaily={game.streaks?.dailyStreak ?? 0}
        streakSolitarie={game.streaks?.solitaireStreak ?? 0}
      />

      <Toast message={game.toastMessage} />

      {
        showMainScreen && (
          <MainScreen
            onTutorial={() => setShowTutorial(true)}
            onDailyWord={handleWordDay}
            onSolitaire={handleSolitarie}
            onMultiplayer={handleMultiPlayer}
          />
        )
      }

      {!showMainScreen && (
        <>
          <div className="flex-1 flex flex-col items-center py-2 sm:py-4 gap-2 sm:gap-4 w-full max-w-lg min-h-0">
            {showMultiplayer ? (
              <MultiplayerHome />
            ) : (
              <>
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
              </>
            )}
          </div>
        </>
      )}

      {showTutorial && <Tutorial onClose={handleCloseTutorial} />}
      {showHistoryCompetitive && <CompetitiveRecord onClose={handleCloseHistoryCompetitive} />}
    </main>
  );
}
