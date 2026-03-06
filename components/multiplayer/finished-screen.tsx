import { Equal, LogOut, RotateCcw, ShieldOff, Trophy } from "lucide-react";
import RoundDots from "./round-dots";

interface FinishedScreenProps {
    winnerSocketId: string | "draw" | null;
    mySocketId: string | null;
    rematchStatus: "idle" | "waiting" | "countdown" | "declined";
    roundResultsPlayer: ("win" | "loss" | null)[];
    roundResultsRival: ("win" | "loss" | null)[];
    onRematch: () => void;
    onLeave: () => void;
    nameOpponent: string
}

const FinishedScreen = ({
    winnerSocketId,
    mySocketId,
    rematchStatus,
    roundResultsPlayer,
    roundResultsRival,
    onRematch,
    onLeave,
    nameOpponent
}: FinishedScreenProps) => {
    let result: "win" | "lose" | "draw";
    
    if (!winnerSocketId || winnerSocketId === "draw") {
        result = "draw";
    } else {
        result = winnerSocketId === mySocketId ? "win" : "lose";
    }

    const config = {
        win: {
            icon: <Trophy className="h-8 w-8 text-[#538d4e]" />,
            ringColor: "#538d4e",
            bgColor: "rgba(83,141,78,0.15)",
            title: "Victoria!",
            message: "Has ganado la partida",
            accentColor: "#538d4e",
        },
        lose: {
            icon: <ShieldOff className="h-8 w-8 text-[#b91c1c]" />,
            ringColor: "#b91c1c",
            bgColor: "rgba(185,28,28,0.12)",
            title: "Derrota",
            message: "Estudiale mas, tu puedes!",
            accentColor: "#b91c1c",
        },
        draw: {
            icon: <Equal className="h-8 w-8 text-[#c9b458]" />,
            ringColor: "#c9b458",
            bgColor: "rgba(201,180,88,0.12)",
            title: "Empate",
            message: "Nadie gano esta vez",
            accentColor: "#c9b458",
        },
    }[result];

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-xl shadow-black/30">
                    <div className="h-1" style={{ backgroundColor: config.accentColor }} />

                    <div className="px-6 pb-6 pt-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: config.bgColor,
                                boxShadow: `0 0 0 1px ${config.ringColor}40`,
                            }}
                        >
                            {config.icon}
                        </div>

                        <h2 className="text-center text-2xl font-bold text-foreground">
                            {config.title}
                        </h2>
                        <p className="mt-1.5 text-center text-sm text-muted-foreground">
                            {config.message}
                        </p>

                        <div className="mt-6 rounded-xl border border-border bg-muted p-4">
                            <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                Resultado por ronda
                            </p>
                            <div className="flex items-stretch gap-3">
                                <div className="flex flex-1 flex-col items-center gap-2 rounded-lg bg-muted py-2.5">
                                    <span className="text-[11px] font-semibold text-foreground">Tu</span>
                                    <RoundDots
                                        results={roundResultsPlayer}
                                        totalRounds={3}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <span className="text-[10px] font-bold text-foreground">VS</span>
                                </div>
                                <div className="flex flex-1 flex-col items-center gap-2 rounded-lg bg-muted py-2.5">
                                    <span className="text-[11px] font-semibold text-muted-foreground">{nameOpponent}</span>
                                    <RoundDots
                                        results={roundResultsRival}
                                        totalRounds={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={onRematch}
                                disabled={rematchStatus === "waiting" || rematchStatus === "countdown"}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#538d4e] py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {rematchStatus === "waiting" ? "Esperando..." : "Revancha"}
                            </button>
                            <button
                                onClick={onLeave}
                                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
                            >
                                <LogOut className="h-4 w-4" />
                                Salir
                            </button>
                        </div>

                        {rematchStatus === "declined" && (
                            <p className="mt-3 text-center text-xs font-medium text-[#b91c1c]">
                                El rival declino la revancha.
                            </p>
                        )}
                        {rematchStatus === "countdown" && (
                            <p className="mt-3 text-center text-xs font-medium text-[#538d4e]">
                                Revancha aceptada! Iniciando...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FinishedScreen;