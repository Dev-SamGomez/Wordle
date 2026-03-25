import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tile } from "../wordle/Tile";
interface Props {
    rivalBoard: ("correct" | "present" | "absent" | null)[][];
    title?: string;
    size?: "xs" | "sm" | "md";
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const STEP_MS = 350;
const LAST_CELL_EXTRA_MS = 500;
const TOTAL_REVEAL_MS = (WORD_LENGTH - 1) * STEP_MS + LAST_CELL_EXTRA_MS;

function normalizeBoard(board: ("correct" | "present" | "absent" | null)[][]) {
    const rows = board
        .slice(0, MAX_GUESSES)
        .map((row) => (row ?? []).slice(0, WORD_LENGTH));

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i] ?? [];
        if (r.length < WORD_LENGTH) {
            rows[i] = [...r, ...Array(WORD_LENGTH - r.length).fill(null)];
        }
    }
    while (rows.length < MAX_GUESSES) {
        rows.push(Array(WORD_LENGTH).fill(null));
    }
    return rows;
}

const sizeToPx = { xs: 22, sm: 26, md: 30 };
const BASE_TILE_PX = 62;                      

export function RivalMiniBoard({
    rivalBoard,
    title = "Progreso del rival",
    size = "xs",
}: Props) {
    const cellTarget = sizeToPx[size];
    const scale = cellTarget / BASE_TILE_PX;

    const filledRows = rivalBoard.length;

    const prevFilledRowsRef = useRef(0);

    const [, forceRender] = useState(0);

    const settleTimerRef = useRef<number | null>(null);

    const isNewBatch = filledRows > prevFilledRowsRef.current;
    const revealRow = isNewBatch ? filledRows - 1 : null;

    const grid = useMemo(() => normalizeBoard(rivalBoard), [rivalBoard]);

    useEffect(() => {
        if (filledRows === 0) {
            if (settleTimerRef.current) {
                window.clearTimeout(settleTimerRef.current);
                settleTimerRef.current = null;
            }
            prevFilledRowsRef.current = 0;
            forceRender((x) => x + 1);
            return;
        }

        if (isNewBatch) {
            if (settleTimerRef.current) {
                window.clearTimeout(settleTimerRef.current);
            }
            settleTimerRef.current = window.setTimeout(() => {
                prevFilledRowsRef.current = filledRows;
                settleTimerRef.current = null;
                forceRender((x) => x + 1);
            }, TOTAL_REVEAL_MS);
        }

        return () => {
            if (settleTimerRef.current) {
                window.clearTimeout(settleTimerRef.current);
                settleTimerRef.current = null;
            }
        };
    }, [filledRows, isNewBatch]);

    return (
        <div className="flex flex-col items-center gap-2 w-fit">
            <div className="grid grid-rows-6 gap-[3px] md:gap-[4px] w-fit mx-auto">
                {grid.map((row, i) => (
                    <div key={i} className="grid grid-cols-5 gap-[3px] md:gap-[4px]">
                        {row.map((cell, j) => (
                            <div
                                key={j}
                                className="relative"
                                style={{
                                    width: `${cellTarget}px`,
                                    height: `${cellTarget}px`,
                                    overflow: "hidden",
                                }}
                            >
                                <div className="origin-top-left" style={{ transform: `scale(${scale})` }}>
                                    <Tile
                                        letter=""                                  
                                        state={cell ?? undefined}                  
                                        isRevealing={revealRow === i}              
                                        revealDelay={j * STEP_MS}                  
                                        isCurrentRow={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="text-center text-xs text-muted-foreground">{title}</div>
        </div>
    );
}