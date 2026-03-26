"use client";

import { BRPlayer } from "@/hooks/use-battleroyal";

interface Props {
    players: BRPlayer[];
    mySocketId: string;
    isSuddenDeath: boolean;
    isSpectator?: boolean;
}

export default function BRLeaderboard({ players, mySocketId, isSuddenDeath, isSpectator }: Props) {
    const active = players.filter(p => !p.isEliminated);
    const done = active.filter(p => p.finishedCurrentWord);
    const playing = active.filter(p => !p.finishedCurrentWord);
    const eliminated = players.filter(p => p.isEliminated);

    const getPillConfig = (p: BRPlayer) => {
        const isMe = p.socketId === mySocketId;
        const isSpec = isMe && p.isEliminated;

        if (p.isEliminated) return isSpec
            ? { text: "Espectador", cls: "bg-muted text-muted-foreground" }
            : { text: "Eliminado", cls: "bg-destructive/20 text-destructive" };

        if (!p.finishedCurrentWord) return isSuddenDeath
            ? { text: "En juego", cls: "bg-destructive/20 text-destructive" }
            : { text: "En juego", cls: "bg-purple-500/20 text-purple-400" };

        if (p.solvedCurrentWord)
            return { text: "Pasa", cls: "bg-[#538d4e]/20 text-[#538d4e]" };

        return { text: "No resolvió", cls: "bg-[#b59f3b]/20 text-[#b59f3b]" };
    };

    const Section = ({ label, rows }: { label: string; rows: BRPlayer[] }) => {
        if (rows.length === 0) return null;
        return (
            <div>
                <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                </div>
                {rows.map((p, i) => {
                    const isMe = p.socketId === mySocketId;
                    const isSpec = isMe && p.isEliminated;
                    const pill = getPillConfig(p);

                    return (
                        <div
                            key={p.socketId}
                            className={`flex items-center gap-2 px-2 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2 ${isMe && !p.isEliminated
                                    ? "bg-blue-500/10"
                                    : isSpec
                                        ? "bg-destructive/10"
                                        : p.isEliminated
                                            ? "opacity-40"
                                            : ""
                                }`}
                        >
                            <span className="w-3 sm:w-4 text-[9px] sm:text-[10px] font-medium text-muted-foreground text-center flex-shrink-0">
                                {p.isEliminated ? "—" : i + 1}
                            </span>

                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-foreground flex-shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] sm:text-[12px] font-medium text-foreground truncate">
                                    {p.name}
                                </div>
                                {isMe && (
                                    <div className={`text-[8px] sm:text-[9px] ${isSpec ? "text-destructive" : "text-blue-400"}`}>
                                        {isSpec ? "Espectador" : "Tú"}
                                    </div>
                                )}
                            </div>

                            <div className="text-[9px] sm:text-[10px] font-medium tabular-nums text-muted-foreground flex-shrink-0 w-6 sm:w-7 text-center">
                                {p.isEliminated ? "—" : (
                                    <>
                                        {!p.finishedCurrentWord && (
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1 align-middle animate-pulse" />
                                        )}
                                        {p.currentAttempt}/6
                                    </>
                                )}
                            </div>

                            <span className={`text-[8px] sm:text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${pill.cls}`}>
                                {pill.text}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="border-b border-border">
            <div className="flex items-baseline justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">
                    {isSuddenDeath ? "Finalistas" : "Leaderboard"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {isSuddenDeath ? "Sudden Death" : `${active.length} activos`}
                </span>
            </div>
            {isSuddenDeath ? (
                <>
                    <Section label="En juego — Sudden Death" rows={active} />
                    {eliminated.length > 0 && (
                        <>
                            <div className="h-px bg-border mx-3" />
                            <Section label="Posición final" rows={eliminated} />
                        </>
                    )}
                </>
            ) : (
                <>
                    {done.length > 0 && <Section label="Ya terminaron" rows={done} />}
                    {playing.length > 0 && (
                        <>
                            {done.length > 0 && <div className="h-px bg-border mx-3" />}
                            <Section label="En juego" rows={playing} />
                        </>
                    )}
                    {eliminated.length > 0 && (
                        <>
                            <div className="h-px bg-border mx-3" />
                            <Section label="Eliminados" rows={eliminated} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}