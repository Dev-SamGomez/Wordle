"use client";

import { useBattleRoyale } from "@/hooks/use-battleroyal";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import AuthRequiredModal from "../auth/AuthGate";
import BRLobbyScreen from "./br-lobby-screen";
import BRSpectatorScreen from "./br-spectator-screen";
import BRFinishedScreen from "./br-finished-screen";
import BRPlayingScreen from "./br-playing-screen";

interface Props {
    onExit: () => void;
}

export default function BattleRoyaleHome({ onExit }: Props) {
    const { user, authLoading } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const br = useBattleRoyale();

    useEffect(() => {
        if (!authLoading && !user) setShowAuth(true);
    }, [authLoading, user]);

    useEffect(() => {
        if (user && br.phase === "idle") {
            const name = user.displayName ?? user.email?.split("@")[0] ?? "Jugador";
            br.joinQueue(name);
        }
    }, [user]);

    if (!user) {
        return showAuth
            ? <AuthRequiredModal onClose={() => { setShowAuth(false); onExit(); }} />
            : null;
    }

    if (br.phase === "idle" || br.phase === "queue" || br.phase === "lobby" || br.phase === "countdown") {
        return (
            <BRLobbyScreen
                players={br.lobbyPlayers}
                countdownSeconds={br.countdownSeconds}
                canStart={br.canStart}
                isHost={br.isHost}
                phase={br.phase}
                onForceStart={br.forceStart}
                onCancel={() => { br.cancelQueue(); onExit(); }}
            />
        );
    }

    if (br.phase === "spectator") {
        return (
            <BRSpectatorScreen
                players={br.players}
                currentRound={br.currentRound}
                isSuddenDeath={br.isSuddenDeath}
                mySocketId={br.mySocketId ?? ""}
                roundTimerEndsAt={br.roundTimerEndsAt}
                onPlayAgain={() => { br.resetState(); br.joinQueue(); }}
                onExit={() => { br.resetState(); onExit(); }}
            />
        );
    }

    if (br.phase === "finished" && br.gameOverData) {
        return (
            <BRFinishedScreen
                gameOverData={br.gameOverData}
                mySocketId={br.mySocketId ?? ""}
                onPlayAgain={() => { br.resetState(); br.joinQueue(); }}
                onExit={() => { br.resetState(); onExit(); }}
            />
        );
    }

    return (
        <BRPlayingScreen
            br={br}
            onExit={() => { br.resetState(); onExit(); }}
        />
    );
}