"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Users, HelpCircle, CalendarDays } from "lucide-react";
import { DAILY_BOARD, LETTERS, MINI_BOARD } from "@/data/letters-title";
import { STATE_COLORS } from "@/data/dictionaries/state-colors";

const GRID_ROWS = 6;
const GRID_COLS = 5;
const CELL_COLORS = ["#538d4e", "#c9b458", "#3a3a3c"];

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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#121213]">
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
                                className="rounded-md border border-[#3a3a3c]/20 transition-all duration-1000"
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
                                    className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-[#3a3a3c] bg-[#121213]"
                                    style={{ backfaceVisibility: "hidden" }}
                                />
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        backgroundColor:
                                            revealedCount > i
                                                ? letter.color === "#538d4e"
                                                    ? "#538d4e"
                                                    : "#3a3a3c"
                                                : "#121213",
                                    }}
                                >
                                    <span
                                        className="font-serif text-3xl font-bold tracking-wide"
                                        style={{
                                            color: "#e5e5e7",
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
                    className="mb-12 text-sm tracking-widest text-[#818184] uppercase transition-all duration-700"
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
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#c9b458]/30 bg-[#1a1a1b] p-4 text-left transition-all duration-300 hover:border-[#c9b458] hover:bg-[#1e1e1f]"
                        onMouseEnter={() => setHoveredCard("daily")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onDailyWord()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c9b458]/20 transition-colors group-hover:bg-[#c9b458]/30">
                                <CalendarDays size={18} className="text-[#c9b458]" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-[#e5e5e7]">
                                    Palabra del dia
                                </span>
                                <span className="text-[10px] leading-tight text-[#818184]">
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
                                            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-[#e5e5e7]"
                                            style={{
                                                backgroundColor: STATE_COLORS[cell.state],
                                                border:
                                                    cell.state === "empty"
                                                        ? "1px solid #3a3a3c"
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
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#3a3a3c] bg-[#1a1a1b] p-4 text-left transition-all duration-300 hover:border-[#818184] hover:bg-[#1e1e1f]"
                        onMouseEnter={() => setHoveredCard("solo")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onSolitaire()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3a3a3c] transition-colors group-hover:bg-[#4a4a4c]">
                                <User size={18} className="text-[#e5e5e7]" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-[#e5e5e7]">
                                    Solitario
                                </span>
                                <span className="text-[10px] leading-tight text-[#818184]">
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
                                            className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-[#e5e5e7]"
                                            style={{
                                                backgroundColor: STATE_COLORS[cell.state],
                                                border:
                                                    cell.state === "empty"
                                                        ? "1px solid #3a3a3c"
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
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#538d4e]/30 bg-[#1a1a1b] p-4 text-left transition-all duration-300 hover:border-[#538d4e] hover:bg-[#1e1e1f]"
                        onMouseEnter={() => setHoveredCard("multi")}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onMultiplayer()}
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#538d4e]/20 transition-colors group-hover:bg-[#538d4e]/30">
                                <Users size={18} className="text-[#538d4e]" />
                            </div>
                            <div className="min-w-0">
                                <span className="block font-sans text-sm font-bold text-[#e5e5e7]">
                                    Competitivo
                                </span>
                                <span className="text-[10px] leading-tight text-[#818184]">
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#3a3a3c] bg-[#2a2a2c]">
                                <User size={18} className="text-[#e5e5e7]" />
                            </div>
                            <span className="font-sans text-xl font-black text-[#538d4e]">
                                VS
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#538d4e]/30 bg-[#538d4e]/10">
                                <User size={18} className="text-[#538d4e]" />
                            </div>
                        </div>
                    </button>
                </div>

                <button
                    className="mt-10 flex items-center gap-2 text-sm text-[#818184] transition-all duration-700 hover:text-[#e5e5e7]"
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
