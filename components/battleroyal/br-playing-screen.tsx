"use client";

import { useEffect, useRef, useState } from "react";
import { Board } from "@/components/wordle/Board";
import { Keyboard } from "@/components/wordle/Keyboard";
import BRLeaderboard from "./br-leaderboard";
import { useBattleRoyale } from "@/hooks/use-battleroyal";
import { useGame } from "@/hooks/use-game";
import type { LetterState } from "@/utils/evaluateWord";
import { Toast } from "../wordle/Toast";

interface Props {
    br: ReturnType<typeof useBattleRoyale>;
    onExit: () => void;
}

export default function BRPlayingScreen({ br, onExit }: Props) {
    const game = useGame();
    const [secondsLeft, setSecondsLeft] = useState(0);

    const processedRevealKeysRef = useRef<Set<string>>(new Set());
    const subscribedRef = useRef(false);

    const myPlayer = br.players.find(p => p.socketId === br.mySocketId);
    const iFinished = myPlayer?.finishedCurrentWord ?? false;

    useEffect(() => {
        game.multiplayerMode();
    }, []);

    useEffect(() => {
        if (!br.currentWord) return;
        processedRevealKeysRef.current.clear();
        game.multiplayerMode();
        game.startMultiplayerRound(br.currentWord);
    }, [br.currentRound, br.currentWord]);

    useEffect(() => {
        if (!br.roundTimerEndsAt) { setSecondsLeft(0); return; }
        const tick = () => {
            setSecondsLeft(Math.max(0, Math.round((br.roundTimerEndsAt! - Date.now()) / 1000)));
        };
        tick();
        const interval = setInterval(tick, 500);
        return () => clearInterval(interval);
    }, [br.roundTimerEndsAt]);

    useEffect(() => {
        if (subscribedRef.current) return;
        subscribedRef.current = true;
        const unsub = game.onRevealComplete(({ rowIndex, wasSolved, evaluation, wordFinished, solution }) => {
            const sol = solution?.toUpperCase?.() ?? solution;
            const dedupeKey = `${sol}:${rowIndex}`;
            if (processedRevealKeysRef.current.has(dedupeKey)) return;
            processedRevealKeysRef.current.add(dedupeKey);
            br.submitRow({
                wordIndex: br.currentRound,
                wasSolved,
                wordFinished: !!wordFinished,
                lastEval: evaluation as LetterState[],
            });
        });
        return () => { unsub?.(); subscribedRef.current = false; };
    }, [game, br]);

    function formatTimer(secs: number) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    const timerColor = secondsLeft <= 30 ? "text-destructive" : "text-muted-foreground";
    const isSD = br.isSuddenDeath;

    const StatusBar = (
        isSD ? (
            <div className="flex items-center justify-between px-4 py-2 bg-destructive/80 flex-shrink-0">
                <span className="text-xs font-semibold text-destructive-foreground tracking-wide">
                    Muerte Súbita
                </span>
                <span className="text-lg font-black text-white tabular-nums animate-pulse">
                    {formatTimer(secondsLeft)}
                </span>
            </div>
        ) : (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                    Ronda {br.currentRound + 1} de {br.players.length}
                </span>
                <span className={`text-sm font-bold tabular-nums ${timerColor}`}>
                    {formatTimer(secondsLeft)}
                </span>
            </div>
        )
    );

    return (
        <div className="flex h-dvh flex-col bg-background overflow-hidden relative">

            {StatusBar}

            <div className="flex flex-col flex-1 min-h-0 md:hidden">
                <div className="flex-shrink-0 overflow-y-auto max-h-[35%]">
                    <BRLeaderboard players={br.players} mySocketId={br.mySocketId ?? ""} isSuddenDeath={isSD} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-between min-h-0 py-2 px-2 gap-2">
                    <div className="self-start text-[11px] text-muted-foreground">
                        Palabra <span className="font-semibold text-foreground">{br.currentRound + 1}</span> de {br.players.length}
                    </div>
                    <div className="flex-1 flex items-center justify-center w-full">
                        <Board
                            guesses={game.guesses}
                            evaluations={game.evaluations}
                            currentGuess={game.currentGuess}
                            currentRow={game.currentRow}
                            revealingRow={game.revealingRow}
                            onRevealComplete={game.finishReveal}
                        />
                    </div>
                    <div className="w-full flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
                        <Keyboard onKey={game.handleKeyPress} keyboardColors={game.keyboardColors} />
                    </div>
                    {!(game.toastMessage === "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                        <Toast message={game.toastMessage} />
                    )}
                </div>
            </div>

            <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-between py-4 px-4 border-r border-border min-h-0 gap-3">
                    <div className="text-[11px] text-muted-foreground self-start">
                        Palabra <span className="font-semibold text-foreground">{br.currentRound + 1}</span> de {br.players.length}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <Board
                            guesses={game.guesses}
                            evaluations={game.evaluations}
                            currentGuess={game.currentGuess}
                            currentRow={game.currentRow}
                            revealingRow={game.revealingRow}
                            onRevealComplete={game.finishReveal}
                        />
                    </div>
                    <div className="w-full flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
                        <Keyboard onKey={game.handleKeyPress} keyboardColors={game.keyboardColors} />
                    </div>
                    {!(game.toastMessage === "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                        <Toast message={game.toastMessage} />
                    )}
                </div>
                <div className="w-56 lg:w-64 flex-shrink-0 overflow-y-auto">
                    <BRLeaderboard players={br.players} mySocketId={br.mySocketId ?? ""} isSuddenDeath={isSD} />
                </div>
            </div>

            {iFinished && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col bg-background/95 backdrop-blur-sm z-20"
                    style={{ top: isSD ? '40px' : '41px' }}>
                    <div className="flex items-center justify-center gap-2 py-3 bg-[#538d4e]/20 border-b border-[#538d4e]/30 flex-shrink-0">
                        <span className="text-sm font-semibold text-[#538d4e]">
                            ✓ Resuelta — prepárate para la siguiente
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <BRLeaderboard
                            players={br.players}
                            mySocketId={br.mySocketId ?? ""}
                            isSuddenDeath={br.isSuddenDeath}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}