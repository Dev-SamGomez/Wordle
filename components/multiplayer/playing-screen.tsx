import { useMultiplayer } from "@/hooks/use-multiplayergame";
import { Board } from "../wordle/Board";
import { Keyboard } from "../wordle/Keyboard";
import { Toast } from "../wordle/Toast";
import RoundDots from "./round-dots";
import { RivalMiniBoard } from "./mini-board-rival";
interface PlayingScreenProps {
    game: ReturnType<typeof useMultiplayer>;
}

const BOARD_PX = 560;
const MINI_PX = 220;
const GAP_PX = 24;

const PlayingScreen = ({
    game,
}: PlayingScreenProps) => {

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

            <div className="pt-5 text-xs text-[hsl(var(--destructive))]">
                Palabra {game.currentWordIndex < 3 ? game.currentWordIndex + 1 : game.currentWordIndex}/3
            </div>

            <div className="w-full px-4 pt-5">
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

            {!(game.toastMessage === "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                <Toast message={game.toastMessage} />
            )}
        </div>

    );
}

export default PlayingScreen;