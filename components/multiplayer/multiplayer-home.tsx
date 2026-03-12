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

export default function MultiplayerHome() {
    const { user, authLoading } = useAuth();
    const game = useMultiplayer();
    const [showAuth, setShowAuth] = useState(false);
    const [name, setName] = useState("");

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
