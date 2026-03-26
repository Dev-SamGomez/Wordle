"use client";

import { BRPlayer } from "@/hooks/use-battleroyal";
import BRLeaderboard from "./br-leaderboard";
import { useEffect, useState } from "react";

interface Props {
    players: BRPlayer[];
    currentRound: number;
    isSuddenDeath: boolean;
    mySocketId: string;
    roundTimerEndsAt: number | null;
    onPlayAgain: () => void;
    onExit: () => void;
}

export default function BRSpectatorScreen({
    players, currentRound, isSuddenDeath, mySocketId, roundTimerEndsAt, onPlayAgain, onExit
}: Props) {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!roundTimerEndsAt) { setSecondsLeft(0); return; }
        const tick = () => {
            setSecondsLeft(Math.max(0, Math.round((roundTimerEndsAt - Date.now()) / 1000)));
        };
        tick();
        const interval = setInterval(tick, 500);
        return () => clearInterval(interval);
    }, [roundTimerEndsAt]);

    function formatTimer(secs: number) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }
    return (
        <div className="h-dvh flex flex-col bg-background">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40 flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                    {isSuddenDeath ? "Muerte Súbita" : `Ronda ${currentRound + 1}`}
                </span>
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold tabular-nums ${secondsLeft <= 30 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatTimer(secondsLeft)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Espectador</span>
                </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">
                    Espectador — eliminado en Ronda {currentRound}
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
                <BRLeaderboard
                    players={players}
                    mySocketId={mySocketId}
                    isSuddenDeath={isSuddenDeath}
                    isSpectator
                />
            </div>

            <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
                <button
                    onClick={onPlayAgain}
                    className="flex-1 py-3 rounded-xl bg-[#538d4e] text-foreground font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                    Jugar de nuevo
                </button>
                <button
                    onClick={onExit}
                    className="px-5 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition"
                >
                    Salir
                </button>
            </div>
        </div>
    );
}