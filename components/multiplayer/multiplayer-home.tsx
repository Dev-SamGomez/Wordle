"use client";

import { useMultiplayer } from "@/hooks/use-multiplayergame";
import LobbyScreen from "./lobby-screen";
import WaitingScreen from "./waiting-screen";
import CountdownScreen from "./countdown-screen";
import PlayingScreen from "./playing-screen";
import FinishedScreen from "./finished-screen";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import AuthRequiredModal from "../auth/AuthGate";
import BattleRoyaleHome from "../battleroyal/battle-royal-home";
import { CompetitiveMode } from "@/data/competitive-res";

export default function MultiplayerHome() {
    const { user, authLoading } = useAuth();
    const game = useMultiplayer();
    const [showAuth, setShowAuth] = useState(false);
    const [name, setName] = useState("");
    const [selectedMode, setSelectedMode] = useState<CompetitiveMode>(null);

    useEffect(() => {
        if (!user) return;
        const fallback = user.email?.split("@")[0] ?? "Jugador";
        const nickname = user.displayName ?? fallback;
        setName(nickname)
    }, [user]);

    if (!user) {
        return (
            <>
                <div className="bg-background flex items-center justify-center m-auto px-6 text-center">
                    <div className="max-w-sm">
                        <h2 className="text-xl font-bold mb-3 text-foreground">
                            Inicia sesión para jugar competitivo
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Para jugar contra otras personas, ver tus resultados,
                            guardar tu progreso y aparecer en el ranking global,
                            primero necesitas iniciar sesión.
                        </p>
                        <button
                            onClick={() => setShowAuth(true)}
                            className="mt-4 w-full py-3 rounded-lg
                            bg-[hsl(var(--tile-correct))]
                            text-foreground font-semibold
                            hover:opacity-90 transition
                            disabled:opacity-50"
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                </div>

                {showAuth && (
                    <>
                        <AuthRequiredModal onClose={() => setShowAuth(false)} />
                    </>
                )}
            </>
        );
    }

    if (!selectedMode) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm flex flex-col gap-4">
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-bold text-foreground">Competitivo</h2>
                        <p className="text-sm text-muted-foreground mt-1">Elige tu modo de juego</p>
                    </div>

                    <button
                        onClick={() => setSelectedMode("1v1")}
                        className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-[#538d4e]/50 hover:bg-card/95 transition-all text-left"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M2 14l6 6" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-foreground text-sm">Duelo 1 vs 1</div>
                            <div className="text-xs text-muted-foreground mt-0.5">3 palabras · el primero en resolverlas gana</div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>

                    <button
                        onClick={() => setSelectedMode("battle_royale")}
                        className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-[#538d4e]/50 hover:bg-card/95 transition-all text-left"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#538d4e]/10 flex-shrink-0">
                            <svg className="w-6 h-6 text-[#538d4e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">Battle Royale</span>
                                <span className="text-[9px] font-semibold bg-[#538d4e]/20 text-[#538d4e] px-1.5 py-0.5 rounded-full">Nuevo</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">4 a 6 jugadores · eliminación progresiva</div>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    if (selectedMode === "battle_royale") {
        return <BattleRoyaleHome onExit={() => setSelectedMode(null)} />;
    }

    if (!game.roomId) {
        return <LobbyScreen game={game} namePlayer={name} />;
    }

    if (game.gameStatus === "waiting") {
        return <WaitingScreen roomId={game.roomId} />;
    }

    if (game.gameStatus === "countdown") {
        return <CountdownScreen
            countdown={game.countdown}
            myName={game.myName}
            opponentName={game.opponentName}
        />;
    }

    if (game.gameStatus === "playing") {
        return <PlayingScreen game={game} />;
    }

    if (game.gameStatus === "finished") {
        return <FinishedScreen
            winnerSocketId={game.winnerSocketId}
            mySocketId={game.mySocketId}
            rematchStatus={game.rematchStatus}
            onRematch={game.requestRematch}
            onLeave={game.leaveRoom}
            roundResultsPlayer={game.roundResultsPlayer}
            roundResultsRival={game.roundResultsRival}
            nameOpponent={game.opponentName}
        />;
    }

    return null;
}
