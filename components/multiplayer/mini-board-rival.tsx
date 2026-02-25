interface Props {
    rivalBoard: ("correct" | "present" | "absent" | null)[][];
    rivalWordIndex: number;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function getColor(state: string | null) {
    if (!state) return "bg-[#121213] border-[#3a3a3c]";
    if (state === "correct") return "bg-[#538d4e] border-[#538d4e]";
    if (state === "present") return "bg-[#b59f3b] border-[#b59f3b]";
    return "bg-[#3a3a3c] border-[#3a3a3c]";
}

function normalizeBoard(
    board: ("correct" | "present" | "absent" | null)[][]
) {
    const rows = board.slice(0, MAX_GUESSES).map((row) =>
        (row ?? []).slice(0, WORD_LENGTH)
    );

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < WORD_LENGTH) {
            rows[i] = [...row, ...Array(WORD_LENGTH - row.length).fill(null)];
        }
    }

    while (rows.length < MAX_GUESSES) {
        rows.push(Array(WORD_LENGTH).fill(null));
    }

    return rows;
}

export function RivalMiniBoard({ rivalBoard, rivalWordIndex }: Props) {
    const grid = normalizeBoard(rivalBoard);

    return (
        <div className="mt-4 flex flex-col items-center gap-2">
            <div className="text-xs text-[#ac461d]">
                Rival en palabra {rivalWordIndex + 1}/3
            </div>

            <div className="flex flex-col gap-1.5">
                {grid.map((row, i) => (
                    <div key={i} className="flex gap-1.5">
                        {row.map((cell, j) => (
                            <div
                                key={j}
                                className={`h-4 w-4 rounded-[4px] border ${getColor(cell)}`}
                                aria-label={cell ?? "empty"}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}