"use client";

import { BRGameOverData } from "@/hooks/use-battleroyal";
import { Trophy } from "lucide-react";

interface Props {
    gameOverData: BRGameOverData;
    mySocketId: string;
    onPlayAgain: () => void;
    onExit: () => void;
}

function positionLabel(pos: number) {
    switch (pos) {
        case 1: return "1er lugar";
        case 2: return "2do lugar";
        case 3: return "3er lugar";
        default: return `${pos}to lugar`;
    }
}

function positionAccentColor(pos: number) {
    switch (pos) {
        case 1: return "text-[#b59f3b]";
        case 2: return "text-muted-foreground";
        case 3: return "text-amber-600";
        default: return "text-muted-foreground";
    }
}

function deltaColor(delta: number) {
    if (delta > 0) return "text-[#538d4e]";
    if (delta < 0) return "text-destructive";
    return "text-muted-foreground";
}

export default function BRFinishedScreen({ gameOverData, mySocketId, onPlayAgain, onExit }: Props) {
    const me = gameOverData.finalPositions.find(p => p.socketId === mySocketId);
    const myPosition = me?.position ?? 0;
    const myDelta = me?.cupsChange ?? 0;
    const isWinner = myPosition === 1;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl bg-muted shadow-xl shadow-black/30 overflow-hidden">

                    <div className={`h-1 w-full ${isWinner ? "bg-[#538d4e]" :
                            myPosition === 2 ? "bg-muted-foreground" :
                                myPosition === 3 ? "bg-amber-600" :
                                    "bg-destructive/60"
                        }`} />

                    <div className="p-7 flex flex-col items-center gap-5">

                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${isWinner
                                ? "bg-[#538d4e]/10 border-[#538d4e]/40"
                                : "bg-muted/40 border-border"
                            }`}>
                            {isWinner
                                ? <Trophy className="w-8 h-8 text-[#b59f3b]" />
                                : <span className={`text-2xl font-black ${positionAccentColor(myPosition)}`}>
                                    {myPosition}
                                </span>
                            }
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-black text-foreground">
                                {isWinner ? "¡Campeón BR!" : positionLabel(myPosition)}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {gameOverData.finalPositions.length} jugadores · Battle Royale
                            </p>
                            <p className={`text-xl font-black mt-2 tabular-nums ${deltaColor(myDelta)}`}>
                                {myDelta > 0 ? `+${myDelta}` : myDelta} cups BR
                            </p>
                            {gameOverData.reachedSuddenDeath && (
                                <span className="mt-2 inline-block text-[10px] font-semibold bg-destructive/20 text-destructive px-3 py-1 rounded-full">
                                    Llegó a Sudden Death
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 w-full">
                            {[
                                { val: me?.wordsResolved ?? 0, lbl: "Palabras" },
                                { val: gameOverData.finalPositions.length, lbl: "Jugadores" },
                                { val: positionLabel(myPosition), lbl: "Posición" },
                            ].map(({ val, lbl }) => (
                                <div key={lbl} className="bg-background rounded-xl p-3 text-center border border-border">
                                    <div className="text-base font-black text-foreground tabular-nums">{val}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{lbl}</div>
                                </div>
                            ))}
                        </div>

                        <div className="w-full bg-background rounded-xl border border-border overflow-hidden">
                            <div className="px-4 py-2 border-b border-border">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    Clasificación final
                                </span>
                            </div>
                            {gameOverData.finalPositions.map((p, i) => {
                                const isMe = p.socketId === mySocketId;
                                return (
                                    <div
                                        key={p.socketId}
                                        className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? "bg-[#538d4e]/10" : ""
                                            } ${i < gameOverData.finalPositions.length - 1 ? "border-b border-border" : ""}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${p.position === 1 ? "bg-[#b59f3b]/20 text-[#b59f3b]" :
                                                p.position === 2 ? "bg-muted text-muted-foreground" :
                                                    p.position === 3 ? "bg-amber-600/20 text-amber-600" :
                                                        "bg-muted/50 text-muted-foreground"
                                            }`}>
                                            {p.position}
                                        </div>

                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-foreground truncate">{p.name}</div>
                                            {isMe && <div className="text-[9px] text-[#538d4e]">Tú</div>}
                                        </div>

                                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                            {p.wordsResolved} pal.
                                        </span>

                                        <span className={`text-xs font-black tabular-nums flex-shrink-0 min-w-[52px] text-right ${deltaColor(p.cupsChange)}`}>
                                            {p.cupsChange > 0 ? `+${p.cupsChange}` : p.cupsChange} cups
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onPlayAgain}
                                className="flex-1 py-3 rounded-xl bg-[#538d4e] text-foreground font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                                </svg>
                                Jugar de nuevo
                            </button>
                            <button
                                onClick={onExit}
                                className="px-5 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}