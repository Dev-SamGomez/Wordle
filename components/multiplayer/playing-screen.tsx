import { useMultiplayer } from "@/hooks/use-multiplayergame";
import { Board } from "../wordle/Board";
import { Keyboard } from "../wordle/Keyboard";
import { Toast } from "../wordle/Toast";
import RoundDots from "./round-dots";

interface PlayingScreenProps {
    game: ReturnType<typeof useMultiplayer>;
}

const PlayingScreen = ({
    game,
}: PlayingScreenProps) => {
    console.log("STATUS:", game.gameStatus);
    console.log("PlayingScreen opponent:", game.opponentName, "my:", game.myName);
    return (
        <div className="flex min-h-screen flex-col items-center bg-background p-4">
            <div className="flex items-stretch gap-3">
                <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted py-3 px-2">
                    <span className="text-xs font-semibold text-foreground">Tu</span>
                    <RoundDots
                        results={game.roundResultsPlayer}
                        totalRounds={3}
                    />
                </div>
                <div className="flex items-center">
                    <span className="text-xs font-bold text-muted-foreground">VS</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted py-3 px-2">
                    <span className="text-xs font-semibold text-foreground">
                        {game.opponentName || "Rival"}
                    </span>
                    <RoundDots
                        results={game.roundResultsRival}
                        totalRounds={3}
                    />
                </div>
            </div>
            <div className="pt-5 text-xs text-[hsl(var(--destructive))]">
                Palabra {game.currentWordIndex < 3 ? game.currentWordIndex + 1 : game.currentWordIndex}/3
            </div>
            <div className="flex flex-col p-10 items-center sm:gap-4 justify-center min-h-0">
                <Board
                    guesses={game.guesses}
                    evaluations={game.evaluations}
                    currentGuess={game.currentGuess}
                    currentRow={game.currentRow}
                    revealingRow={game.revealingRow}
                    onRevealComplete={game.handleRevealComplete}
                />
            </div>

            <div className="w-full shrink-0 pb-[env(safe-area-inset-bottom)]">
                <Keyboard
                    onKey={game.handleKeyPress}
                    keyboardColors={game.keyboardColors}
                />
            </div>
            {!(game.toastMessage == "Ganaste!" || game.toastMessage.includes("Perdiste")) && (
                <Toast message={game.toastMessage} />
            )}
        </div>
    );
}

export default PlayingScreen;