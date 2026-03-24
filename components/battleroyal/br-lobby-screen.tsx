"use client";

import { Loader2 } from "lucide-react";

interface LobbyPlayer {
    socketId: string;
    name: string;
    isHost: boolean;
}

interface Props {
    players: LobbyPlayer[];
    countdownSeconds: number;
    canStart: boolean;
    isHost: boolean;
    phase: string;
    onForceStart: () => void;
    onCancel: () => void;
}

export default function BRLobbyScreen({
    players, countdownSeconds, canStart, isHost, phase, onForceStart, onCancel
}: Props) {
    const MAX_SLOTS = 6;
    const emptySlots = MAX_SLOTS - players.length;
    const isCountingDown = countdownSeconds > 0;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl bg-muted p-8 shadow-xl shadow-black/30 flex flex-col items-center gap-6">

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/15 ring-1 ring-[#538d4e]/30">
                        <Loader2 className="h-7 w-7 animate-spin text-[#538d4e]" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-bold text-foreground">
                            {phase === "countdown" ? "¡Iniciando!" : "Battle Royale"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {canStart
                                ? isCountingDown
                                    ? `Iniciando en ${countdownSeconds}s...`
                                    : "Listo para iniciar"
                                : `Esperando jugadores... ${players.length}/6`}
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Jugadores en lobby ({players.length}/6)
                        </p>

                        {players.map((p) => (
                            <div
                                key={p.socketId}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors ${p.isHost
                                        ? "bg-[#538d4e]/10 border-[#538d4e]/40"
                                        : "bg-background border-border"
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex-1 text-sm font-medium text-foreground">{p.name}</span>
                                {p.isHost && (
                                    <span className="text-[10px] font-semibold text-[#538d4e] bg-[#538d4e]/10 px-2 py-0.5 rounded-full">
                                        Host
                                    </span>
                                )}
                            </div>
                        ))}

                        {Array.from({ length: emptySlots }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-dashed border-border/50"
                            >
                                <div className="w-8 h-8 rounded-full bg-muted/30 border border-dashed border-border/50" />
                                <span className="text-sm text-muted-foreground italic">
                                    {i === 0 && players.length < 4
                                        ? `${4 - players.length} más para iniciar`
                                        : "Libre"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${i < players.length ? "bg-[#538d4e]" : "bg-border"
                                    }`}
                            />
                        ))}
                    </div>

                    {isCountingDown && (
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                <span>{countdownSeconds <= 5 ? "¡Iniciando!" : "Iniciando en"}</span>
                                <span className="font-bold text-foreground tabular-nums">{countdownSeconds}s</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#538d4e] rounded-full transition-all duration-1000"
                                    style={{ width: `${(1 - countdownSeconds / 30) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {isHost && (
                        <button
                            onClick={onForceStart}
                            disabled={!canStart}
                            className="w-full py-3 rounded-xl bg-[#538d4e] text-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {canStart
                                ? `Iniciar ahora (${players.length}/6)`
                                : "Esperando jugadores..."}
                        </button>
                    )}

                    <button
                        onClick={onCancel}
                        className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/60 transition"
                    >
                        Cancelar búsqueda
                    </button>

                    {!canStart && (
                        <p className="text-[11px] text-muted-foreground text-center">
                            Mínimo <span className="font-bold text-foreground">4 jugadores</span> para iniciar · Máximo 6
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}