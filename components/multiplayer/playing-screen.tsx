import { useMultiplayer } from "@/hooks/use-multiplayergame";
import { Board } from "../wordle/Board";
import { Keyboard } from "../wordle/Keyboard";
import { Toast } from "../wordle/Toast";
import RoundDots from "./round-dots";
import { RivalMiniBoard } from "./mini-board-rival";
import { usePresenceFirestore } from "@/hooks/use-presence";
import DrawModal from "./draw-modal";
import { useEffect, useState } from "react";
import SurrenderModal from "./surrender-modal";
interface PlayingScreenProps {
    game: ReturnType<typeof useMultiplayer>;
}

const BOARD_PX = 560;
const MINI_PX = 220;
const GAP_PX = 24;

const PlayingScreen = ({ game }: PlayingScreenProps) => {
    const presence = usePresenceFirestore();
    presence.setPlaying(true);

    const [isMobile, setIsMobile] = useState(false);
    const [boardScale, setBoardScale] = useState(1);
    const [surrender, setSurrender] = useState<boolean>(false);

    const handleSurrender = () => {
        setSurrender(false)
        game.surrender()
    }

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        const updateScale = () => {
            const h = window.innerHeight;

            if (h < 650) setBoardScale(0.75);
            else if (h < 750) setBoardScale(0.85);
            else if (h < 850) setBoardScale(0.95);
            else setBoardScale(1);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, []);

    if (isMobile) {
        return (
            <div className="min-h-screen bg-background">

                <div className="flex flex-col items-center w-full px-3 py-2 gap-2">

                    <div className="flex items-stretch gap-2 w-full">
                        <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border bg-muted py-2 px-2">
                            <span className="text-xs font-semibold">Tu</span>
                            <RoundDots results={game.roundResultsPlayer} totalRounds={3} />
                        </div>

                        <div className="flex items-center">
                            <span className="text-xs font-bold text-muted-foreground">VS</span>
                        </div>

                        <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border bg-muted py-2 px-2">
                            <span className="text-xs font-semibold">
                                {game.opponentName}
                            </span>
                            <RoundDots results={game.roundResultsRival} totalRounds={3} />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={game.offerDraw}
                            className="px-3 py-1 text-xs rounded-md bg-muted"
                        >
                            Empate
                        </button>

                        <button
                            onClick={() => setSurrender(true)}
                            className="px-3 py-1 text-xs rounded-md bg-[hsl(var(--destructive))] text-foreground"
                        >
                            Rendirse
                        </button>
                    </div>

                    <div className="text-xs text-[hsl(var(--destructive))]">
                        Palabra {game.currentWordIndex + 1}/3
                    </div>

                    <div
                        className="origin-top flex justify-center w-full"
                        style={{ transform: `scale(${boardScale})` }}
                    >
                        <Board
                            guesses={game.guesses}
                            evaluations={game.evaluations}
                            currentGuess={game.currentGuess}
                            currentRow={game.currentRow}
                            revealingRow={game.revealingRow}
                            onRevealComplete={game.handleRevealComplete}
                        />
                    </div>

                    <div className="mt-1">
                        <RivalMiniBoard
                            rivalBoard={game.rivalBoard}
                            title={`Progreso de ${game.opponentName}`}
                            size="xs"
                        />
                    </div>

                    <div className="w-full max-w-md pb-6">
                        <Keyboard
                            onKey={game.handleKeyPress}
                            keyboardColors={game.keyboardColors}
                        />
                    </div>
                </div>

                {game.drawStatus === "offering" && <Toast message={"Esperando respuesta…"} />}
                {game.drawStatus === "declined" && <Toast message={"Empate rechazado"} />}
                {game.drawStatus === "expired" && <Toast message={"Empate expiró"} />}

                {!(game.toastMessage === "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                    <Toast message={game.toastMessage} />
                )}

                {game.drawStatus === "incoming" && (
                    <DrawModal
                        handleAcceptDraw={() => game.respondDraw(true)}
                        handleRejectDraw={() => game.respondDraw(false)}
                        opponentName={game.drawOfferFrom?.name}
                    />
                )}

                {surrender && (
                    <SurrenderModal
                        handleAcceptSurrender={() => handleSurrender()}
                        handleRejectSurrender={() => setSurrender(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center bg-background p-4">

            <div className="flex items-stretch gap-3">
                <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted py-3 px-2">
                    <span className="text-xs font-semibold text-foreground">Tu</span>
                    <RoundDots results={game.roundResultsPlayer} totalRounds={3} />
                </div>

                <div className="flex items-center">
                    <span className="text-xs font-bold text-muted-foreground">VS</span>
                </div>

                <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted py-3 px-2">
                    <span className="text-xs font-semibold text-foreground">
                        {game.opponentName}
                    </span>
                    <RoundDots results={game.roundResultsRival} totalRounds={3} />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
                <button
                    onClick={game.offerDraw}
                    disabled={game.gameStatus !== "playing" || !(game.drawStatus === "idle")}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                >
                    Empate
                </button>
                <button
                    onClick={() => setSurrender(true)}
                    disabled={game.gameStatus !== "playing"}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[hsl(var(--destructive))] text-foreground hover:opacity-90 disabled:opacity-50"
                >
                    Rendirse
                </button>
            </div>

            <div className="pt-3 text-xs text-[hsl(var(--destructive))]">
                Palabra {game.currentWordIndex < 3 ? game.currentWordIndex + 1 : game.currentWordIndex}/3
            </div>

            <div className="w-full px-4 pt-3">
                <div
                    className="relative mx-auto md:block"
                    style={{
                        width: `min(100%, ${BOARD_PX + GAP_PX + MINI_PX}px)`,
                    }}
                >
                    <div
                        className="mx-auto md:mx-0"
                        style={{
                            width: `min(100%, ${BOARD_PX}px)`,
                        }}
                    >
                        <Board
                            guesses={game.guesses}
                            evaluations={game.evaluations}
                            currentGuess={game.currentGuess}
                            currentRow={game.currentRow}
                            revealingRow={game.revealingRow}
                            onRevealComplete={game.handleRevealComplete}
                        />
                    </div>

                    <div
                        className="hidden md:block"
                        style={{
                            position: "absolute",
                            left: `380px`,
                            top: 100,
                            width: `${MINI_PX}px`,
                        }}
                    >
                        <RivalMiniBoard
                            rivalBoard={game.rivalBoard}
                            title={`Progreso de ${game.opponentName}`}
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center my-3 md:hidden">
                <RivalMiniBoard
                    rivalBoard={game.rivalBoard}
                    title={`Progreso de ${game.opponentName}`}
                    size="xs"
                />
            </div>

            <div className="w-full shrink-0 pt-5 pb-[env(safe-area-inset-bottom)]">
                <Keyboard onKey={game.handleKeyPress} keyboardColors={game.keyboardColors} />
            </div>

            {game.drawStatus === "offering" && <Toast message={"Esperando respuesta…"} />}
            {game.drawStatus === "declined" && <Toast message={"Empate rechazado"} />}
            {game.drawStatus === "expired" && <Toast message={"Empate expiró"} />}

            {!(game.toastMessage === "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                <Toast message={game.toastMessage} />
            )}

            {game.drawStatus === "incoming" && (
                <DrawModal
                    handleAcceptDraw={() => game.respondDraw(true)}
                    handleRejectDraw={() => game.respondDraw(false)}
                    opponentName={game.drawOfferFrom?.name}
                />
            )}

            {surrender && (
                <SurrenderModal
                    handleAcceptSurrender={() => handleSurrender()}
                    handleRejectSurrender={() => setSurrender(false)}
                />
            )}
        </div>
    );
};

export default PlayingScreen;