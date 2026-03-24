"use client";

import { BRPlayer } from "@/hooks/use-battleroyal";
import BRLeaderboard from "./br-leaderboard";

interface Props {
    players: BRPlayer[];
    currentRound: number;
    isSuddenDeath: boolean;
    mySocketId: string;
    onPlayAgain: () => void;
    onExit: () => void;
}

export default function BRSpectatorScreen({
    players, currentRound, isSuddenDeath, mySocketId, onPlayAgain, onExit
}: Props) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                <span className="text-xs font-medium text-muted-foreground">
                    {isSuddenDeath ? "Muerte Súbita" : `Ronda ${currentRound + 1}`}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Espectador</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                <span className="text-xs font-medium text-muted-foreground">
                    Espectador — eliminado en Ronda {currentRound}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto">
                <BRLeaderboard
                    players={players}
                    mySocketId={mySocketId}
                    isSuddenDeath={isSuddenDeath}
                    isSpectator
                />
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
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