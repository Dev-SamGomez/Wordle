"use client";

import { useState, useEffect, useRef } from "react";
import { Board } from "@/components/wordle/Board";
import { Keyboard } from "@/components/wordle/Keyboard";
import { Tutorial } from "@/components/wordle/Tutorial";
import { Toast } from "@/components/wordle/Toast";
import { useGame } from "@/hooks/use-game";
import { Flame, LogOut, Menu, UserIcon } from "lucide-react";
import SidebarMenu from "@/components/wordle/SideBarMenu";
import MultiplayerHome from "@/components/multiplayer/multiplayer-home";
import MainScreen from "@/components/main";
import CompetitiveRecord from "@/components/wordle/HistoryCompetitive";
import Leaderboard from "@/components/wordle/Leaderboard";
import SettingsScreen from "@/components/wordle/ConfigScreen";
import { signOutUser } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import AuthDialogContent from "@/components/auth/AuthGate";
import { formatCups } from "@/utils/competitive";

//TODO: poner una nueva key para animacion solo una vez al dia, para que al reload no este cargando siempre

export default function Home() {
  const { user, authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [pop, setPop] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showHistoryCompetitive, setShowHistoryCompetitive] = useState(false);
  const [showMainScreen, setShowMainScreen] = useState<boolean>(true);
  const [showLeaderBoard, setShowLeaderBoard] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);

  const game = useGame();
  const cups = game.getCompetitiveCups();
  const [showAuth, setShowAuth] = useState(false);
  const [lastCups, setLastCups] = useState(cups);

  const isMultiplayer = game.gameMode === "multiplayer";
  const isDaily = game.gameMode === "daily";
  const streakValue = isDaily
    ? (game.streaks?.dailyStreak ?? 0)
    : (game.streaks?.solitaireStreak ?? 0);

  const isHot = !isMultiplayer && streakValue > 0;
  const isAbsent = !isMultiplayer && streakValue === 0;

  useEffect(() => {
    if (cups > lastCups) {
      setPop(false);
      requestAnimationFrame(() => {
        setPop(true);
        const t = setTimeout(() => setPop(false), 220);
        return () => clearTimeout(t);
      });
    }
    setLastCups(cups);
  }, [cups, lastCups]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  const handleCloseLeaderBoard = () => {
    setShowLeaderBoard(false);
  };

  const handleCloseConfig = () => {
    setShowConfig(false);
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

  const handleMainScreen = () => {
    location.reload()
  }

  const handleWordDay = () => {
    if (showMainScreen) setShowMainScreen(prev => !prev)
    game.startDailyGame()
    if (showMultiplayer) setShowMultiplayer(prev => !prev)
  }

  const handleHistoryCompetitive = () => {
    setShowHistoryCompetitive(true)
  }

  const handleLeaderBoard = () => {
    setShowLeaderBoard(true)
  }

  const handleConfig = () => {
    setShowConfig(true)
  }

  if (!mounted) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#538d4e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="h-dvh bg-background flex flex-col items-center relative select-none overflow-hidden">

      <button
        className="absolute py-2 sm:py-3 left-4 text-muted-foreground hover:text-foreground transition-colors"
        type="button"
        onClick={() => setOpenSidebar(true)}
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {!showMainScreen && (
        <>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-foreground">
              WORDLE
            </h1>
            <span className="text-[10px] sm:text-xs text-[hsl(var(--tile-correct))] font-medium tracking-wider uppercase">
              {game.gameMode === "multiplayer" ? "competitivo" : game.gameMode === "daily" ? "Palabra del dia" : "Solitario"}
            </span>

            <div
              className={[
                "flex items-center gap-1",
                isHot
                  ? "text-red-500"
                  : "text-muted-foreground",
              ].join(" ")}
              title={
                isMultiplayer
                  ? ""
                  : isDaily
                    ? "Racha Diaria"
                    : "Racha Solitario"
              }
            >
              {!isMultiplayer && (
                <>
                  <span className="relative inline-flex items-center justify-center">
                    <Flame
                      className={[
                        "w-4 h-4 sm:w-5 sm:h-5",
                        isHot ? "animate-flame text-red-500 drop-shadow-[0_0_6px_rgba(255,80,80,0.6)]" : "text-muted-foreground"
                      ].join(" ")}
                    />
                    {isHot && (
                      <span className="pointer-events-none absolute inset-0 rounded-full blur-[3px] animate-ember bg-[radial-gradient(ellipse_at_center,rgba(255,120,80,0.45),rgba(255,0,0,0)_60%)]" />
                    )}
                  </span>

                  <span
                    className={[
                      "text-sm sm:text-base font-bold tabular-nums",
                      isAbsent ? "text-muted-foreground" : "text-red-500"
                    ].join(" ")}
                  >
                    {streakValue}
                  </span>
                </>
              )}
            </div>

          </div>
        </>
      )}

      <div className="absolute right-4 top-2 sm:top-3 flex items-center gap-2 z-40">
        {!authLoading && (
          user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="inline-flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors w-9 h-9"
                aria-label="Cuenta"
                title={user.displayName ?? user.email ?? "Cuenta"}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                )}

                <span
                  className={[
                    "absolute -bottom-1 -left-1",
                    "min-w-[18px] h-[18px] px-1",
                    "rounded-full border border-background",
                    "bg-[hsl(var(--tile-correct))] text-background",
                    "text-[10px] leading-[18px] font-extrabold",
                    "flex items-center justify-center shadow-sm",
                    "transition-transform duration-200 ease-out",
                    , pop ? "scale-110 transition-transform" : "scale-100"
                  ].join(" ")}
                  title={`${cups} copas`}
                >
                  {formatCups(cups)}
                </span>

              </button>

              {showUserMenu && (
                <div
                  className="absolute flex flex-col gap-2 right-0 mt-2 pb-2 w-56 rounded-md border border-border bg-background shadow-lg overflow-hidden"
                  role="menu"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                    <p className="truncate text-foreground font-medium">
                      {user.displayName ?? user.email?.split("@")[0] ?? "Jugador"}
                    </p>
                    {user.email && <p className="truncate">{user.email}</p>}
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); setShowConfig(true); }}
                    className="max-w-full m-auto flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-50"
                    role="menuitem"
                  >
                    Configuración
                  </button>
                  {!showMultiplayer && (
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOutUser();
                      }}
                      className="max-w-full m-auto flex items-center justify-center gap-2 rounded-xl bg-[#b91c1c] px-3 py-2 text-sm font-semibold text-background transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors"
            >
              Iniciar sesión
            </button>
          )
        )}
      </div>

      <SidebarMenu
        open={openSidebar}
        onOpenChange={setOpenSidebar}
        onShowMain={handleMainScreen}
        onTutorial={() => setShowTutorial(true)}
        onDailyWord={handleWordDay}
        onSolitaire={handleSolitarie}
        onMultiplayer={handleMultiPlayer}
        onCompetitiveRecord={handleHistoryCompetitive}
        onLeaderBoard={handleLeaderBoard}
        onConfig={handleConfig}
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
                      className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded hover:brightness-110 transition-colors text-sm"
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
      {showLeaderBoard && <Leaderboard onClose={handleCloseLeaderBoard} />}
      {showConfig && <SettingsScreen onClose={handleCloseConfig} />}
      {showAuth && <AuthDialogContent onClose={() => setShowAuth(false)} />}
    </main>
  );
}
