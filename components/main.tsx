"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Users, HelpCircle, CalendarDays } from "lucide-react";
import { DAILY_BOARD, LETTERS, MINI_BOARD } from "@/data/letters-title";
import { STATE_COLORS } from "@/data/dictionaries/state-colors";

const GRID_ROWS = 6;
const GRID_COLS = 5;
const CELL_COLORS = ["hsl(var(--tile-correct))", "hsl(var(--tile-present))", "hsl(var(--tile-absent))"];

interface MainScreenProps {
    onDailyWord: () => void;
    onSolitaire: () => void;
    onMultiplayer: () => void;
    onTutorial: () => void;
}

export default function MainScreen({onDailyWord, onSolitaire, onMultiplayer, onTutorial}: MainScreenProps) {
    const [revealedCount, setRevealedCount] = useState(0);
    const [flippedLetters, setFlippedLetters] = useState<boolean[]>(
        new Array(6).fill(false)
    );
    const [showContent, setShowContent] = useState(false);

    const [litCells, setLitCells] = useState<
        Map<string, { color: string; opacity: number }>
    >(new Map());

    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const lightRandomCell = useCallback(() => {
        const row = Math.floor(Math.random() * GRID_ROWS);
        const col = Math.floor(Math.random() * GRID_COLS);
        const color = CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)];
        const key = `${row}-${col}`;

        setLitCells((prev) => {
            const next = new Map(prev);
            next.set(key, { color, opacity: 0.3 + Math.random() * 0.25 });
            return next;
        });

        setTimeout(() => {
            setLitCells((prev) => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
        }, 1800 + Math.random() * 1500);
    }, []);

    useEffect(() => {
        const interval = setInterval(lightRandomCell, 500);
        for (let i = 0; i < 4; i++) {
            setTimeout(lightRandomCell, i * 150);
        }
        return () => clearInterval(interval);
    }, [lightRandomCell]);

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        LETTERS.forEach((_, i) => {
            timers.push(
                setTimeout(() => {
                    setFlippedLetters((prev) => {
                        const next = [...prev];
                        next[i] = true;
                        return next;
                    });
                    setRevealedCount((prev) => prev + 1);
                }, 500 + i * 450)
            );
        });

        timers.push(
            setTimeout(() => {
                setShowContent(true);
            }, 500 + 6 * 450 + 400)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                <div
                    className="grid gap-1.5"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_COLS}, 52px)`,
                        gridTemplateRows: `repeat(${GRID_ROWS}, 52px)`,
                    }}
                >
                    {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
                        const row = Math.floor(i / GRID_COLS);
                        const col = i % GRID_COLS;
                        const key = `${row}-${col}`;
                        const cell = litCells.get(key);
                        return (
                            <div
                                key={key}
                                className="rounded-md border border-border/20 transition-all duration-1000"
                                style={{
                                    backgroundColor: cell ? cell.color : "transparent",
                                    opacity: cell ? cell.opacity : 0.15,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4">
                <div className="mb-4 flex gap-1.5">
                    {LETTERS.map((letter, i) => (
                        <div
                            key={i}
                            className="perspective-[600px]"
                            style={{ width: 56, height: 62 }}
                        >
                            <div
                                className="relative h-full w-full transition-transform duration-500"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transform: flippedLetters[i]
                                        ? "rotateX(360deg)"
                                        : "rotateX(0deg)",
                                }}
                            >
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-border bg-muted"
                                    style={{ backfaceVisibility: "hidden" }}
                                />
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        backgroundColor:
                                            revealedCount > i
                                                ? letter.color === "#538d4e"
                                                    ? "hsl(var(--tile-correct))"
                                                    : "hsl(var(--tile-absent))"
                                                : "hsl(var(--background))",
                                    }}
                                >
                                    <span
                                        className="font-serif text-3xl font-bold tracking-wide text-foreground"
                                        style={{
                                            opacity: revealedCount > i ? 1 : 0,
                                        }}
                                    >
                                        {letter.char}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p
                    className="mb-12 text-sm tracking-widest text-muted-foreground uppercase transition-all duration-700"
                    style={{
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? "translateY(0)" : "translateY(10px)",
                    }}
                >
                    El juego de las palabras
                </p>

                <div
                    className="grid w-full grid-cols-3 gap-3 transition-all duration-700"
                    style={{
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? "translateY(0)" : "translateY(24px)",
                    }}
                >
                    <button
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[hsl(var(--tile-present))]/30 bg-card p-4 text-left transition-all duration-300 hover:border-[hsl(var(--tile-present))] hover:bg-card/95"
                        onMouseEnter={() => setHoveredCard("daily")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onDailyWord()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--tile-present))]/20 transition-colors group-hover:bg-[hsl(var(--tile-present))]/30">
                                <CalendarDays size={18} className="text-[hsl(var(--tile-present))]" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-foreground">
                                    Palabra del dia
                                </span>
                                <span className="text-[10px] leading-tight text-muted-foreground">
                                    Descubre la palabra de hoy
                                </span>
                            </div>
                        </div>

                        <div
                            className="flex flex-col items-center gap-1 transition-all duration-300"
                            style={{
                                opacity: hoveredCard === "daily" ? 1 : 0.5,
                                transform:
                                    hoveredCard === "daily" ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            {DAILY_BOARD.map((row, ri) => (
                                <div key={ri} className="flex gap-1">
                                    {row.map((cell, ci) => (
                                        <div
                                            key={ci}
                                            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-foreground"
                                            style={{
                                                backgroundColor: STATE_COLORS[cell.state],
                                                border:
                                                    cell.state === "empty"
                                                        ? "1px solid hsl(var(--border))"
                                                        : "none",
                                            }}
                                        >
                                            {cell.letter}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </button>

                    <button
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-muted-foreground hover:bg-card/95"
                        onMouseEnter={() => setHoveredCard("solo")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onSolitaire()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-border transition-colors group-hover:bg-muted">
                                <User size={18} className="text-foreground" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-foreground">
                                    Solitario
                                </span>
                                <span className="text-[10px] leading-tight text-muted-foreground">
                                    Practica sin limite
                                </span>
                            </div>
                        </div>

                        <div
                            className="flex flex-col items-center gap-1 transition-all duration-300"
                            style={{
                                opacity: hoveredCard === "solo" ? 1 : 0.5,
                                transform:
                                    hoveredCard === "solo" ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            {MINI_BOARD.map((row, ri) => (
                                <div key={ri} className="flex gap-1">
                                    {row.map((cell, ci) => (
                                        <div
                                            key={ci}
                                            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-foreground"
                                            style={{
                                                backgroundColor: STATE_COLORS[cell.state],
                                                border:
                                                    cell.state === "empty"
                                                        ? "1px solid hsl(var(--border))"
                                                        : "none",
                                            }}
                                        >
                                            {cell.letter}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </button>

                    <button
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[hsl(var(--tile-correct))]/30 bg-card p-4 text-left transition-all duration-300 hover:border-[hsl(var(--tile-correct))] hover:bg-card/95"
                        onMouseEnter={() => setHoveredCard("multi")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onMultiplayer()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--tile-correct))]/20 transition-colors group-hover:bg-[hsl(var(--tile-correct))]/30">
                                <Users size={18} className="text-[hsl(var(--tile-correct))]" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-foreground">
                                    Competitivo
                                </span>
                                <span className="text-[10px] leading-tight text-muted-foreground">
                                    Desafia a alguien
                                </span>
                            </div>
                        </div>

                        <div
                            className="flex items-center justify-center gap-3 py-2 transition-all duration-300"
                            style={{
                                opacity: hoveredCard === "multi" ? 1 : 0.5,
                                transform:
                                    hoveredCard === "multi" ? "scale(1.05)" : "scale(1)",
                            }}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-muted">
                                <User size={18} className="text-foreground" />
                            </div>
                            <span className="font-sans text-xl font-black text-[hsl(var(--tile-correct))]">
                                VS
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[hsl(var(--tile-correct))]/30 bg-[hsl(var(--tile-correct))]/10">
                                <User size={18} className="text-[hsl(var(--tile-correct))]" />
                            </div>
                        </div>
                    </button>
                </div>

                <button
                    className="mt-10 flex items-center gap-2 text-sm text-muted-foreground transition-all duration-700 hover:text-foreground"
                    style={{
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? "translateY(0)" : "translateY(16px)",
                    }}
                    onClick={() => onTutorial()}
                >
                    <HelpCircle size={16} />
                    Como jugar
                </button>
            </div>
        </div>
    );
}
