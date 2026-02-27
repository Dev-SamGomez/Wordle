"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, X, Crown } from "lucide-react";
import { getRank } from "@/utils/getRank";

export interface LeaderboardPlayer {
    name: string;
    cups: number;
}

//Cambiar mock por get al incluir Firebase
const MOCK_PLAYERS: LeaderboardPlayer[] = [
    { name: "Sammy", cups: 125 },
    { name: "Gus", cups: 45 },
    { name: "Alan", cups: 30 },
    { name: "Joshua", cups: 0 },
    { name: "Ulises", cups: 0 },
    { name: "Deme", cups: 0 },
    { name: "Julian", cups: 0 },
];

interface LeaderboardProps {
    onClose: () => void;
    players?: LeaderboardPlayer[];
}

export default function Leaderboard({ onClose, players }: LeaderboardProps) {
    const data = (players ?? MOCK_PLAYERS).sort((a, b) => b.cups - a.cups);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !isAutoScrolling) return;

        let animationId: number;
        let speed = 0.4;

        const step = () => {
            if (!el) return;
            el.scrollTop += speed;

            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                el.scrollTop = 0;
            }

            animationId = requestAnimationFrame(step);
        };

        const timeout = setTimeout(() => {
            animationId = requestAnimationFrame(step);
        }, 1500);

        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(animationId);
        };
    }, [isAutoScrolling]);

    const handleUserScroll = () => {
        setIsAutoScrolling(false);
        const timeout = setTimeout(() => setIsAutoScrolling(true), 4000);
        return () => clearTimeout(timeout);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-xl w-full max-w-md flex flex-col max-h-[85dvh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#3a3a3c] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-[#b59f3b]" />
                        <h2 className="text-white font-bold text-base tracking-wide">
                            Top mejores jugadores
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#818384] hover:text-white transition-colors p-1"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="shrink-0 px-5 pt-5 pb-3">
                    <div className="flex items-end justify-center gap-3">
                        {data[1] && (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#121213]" style={{ borderColor: getRank(data[1].cups).color }}>
                                    <span className="text-sm font-bold" style={{ color: getRank(data[1].cups).color }}>
                                        {data[1].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-[11px] text-[#d7dadc] font-medium truncate max-w-[64px]">{data[1].name}</span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(data[1].cups).color }} />
                                    <span className="text-[10px] font-bold tabular-nums" style={{ color: getRank(data[1].cups).color }}>{data[1].cups}</span>
                                </div>
                                <div className="w-14 h-14 bg-[#3a3a3c]/40 border border-[#3a3a3c] rounded-t-md flex items-center justify-center">
                                    <span className="text-lg font-bold text-[#9ca3af]">2</span>
                                </div>
                            </div>
                        )}

                        {data[0] && (
                            <div className="flex flex-col items-center gap-1.5 -mt-4">
                                <Crown className="w-5 h-5 text-[#fbbf24]" />
                                <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-[#121213]" style={{ borderColor: getRank(data[0].cups).color }}>
                                    <span className="text-base font-bold" style={{ color: getRank(data[0].cups).color }}>
                                        {data[0].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs text-[#d7dadc] font-semibold truncate max-w-[72px]">{data[0].name}</span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(data[0].cups).color }} />
                                    <span className="text-[11px] font-bold tabular-nums" style={{ color: getRank(data[0].cups).color }}>{data[0].cups}</span>
                                </div>
                                <div className="w-14 h-20 bg-[#fbbf24]/10 border border-[#fbbf24]/40 rounded-t-md flex items-center justify-center">
                                    <span className="text-xl font-bold text-[#fbbf24]">1</span>
                                </div>
                            </div>
                        )}

                        {data[2] && (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#121213]" style={{ borderColor: getRank(data[2].cups).color }}>
                                    <span className="text-sm font-bold" style={{ color: getRank(data[2].cups).color }}>
                                        {data[2].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-[11px] text-[#d7dadc] font-medium truncate max-w-[64px]">{data[2].name}</span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(data[2].cups).color }} />
                                    <span className="text-[10px] font-bold tabular-nums" style={{ color: getRank(data[2].cups).color }}>{data[2].cups}</span>
                                </div>
                                <div className="w-14 h-10 bg-[#cd7f32]/10 border border-[#cd7f32]/40 rounded-t-md flex items-center justify-center">
                                    <span className="text-lg font-bold text-[#cd7f32]">3</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 shrink-0">
                    <div className="border-t border-[#3a3a3c]" />
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-[10px] text-[#818384] uppercase tracking-wider font-medium">
                            Clasificacion completa
                        </span>
                        <span className="text-[10px] text-[#818384] tabular-nums">
                            {data.length} jugadores
                        </span>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto min-h-0 px-5 pb-5"
                    onTouchStart={handleUserScroll}
                    onWheel={handleUserScroll}
                >
                    <div className="flex flex-col gap-1.5">
                        {data.map((player, idx) => {
                            const rank = getRank(player.cups);
                            const position = idx + 1;
                            const isTop3 = position <= 3;
                            const posColors = [
                                "text-[#fbbf24]",
                                "text-[#9ca3af]",
                                "text-[#cd7f32]",
                            ];

                            return (
                                <div
                                    key={`${player.name}-${idx}`}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isTop3
                                        ? "bg-[#1a1a1b] border-[#3a3a3c]"
                                        : "bg-[#121213] border-[#2a2a2b]"
                                        }`}
                                >
                                    <div className="w-7 flex items-center justify-center shrink-0">
                                        <span
                                            className={`text-sm font-bold tabular-nums ${isTop3 ? posColors[position - 1] : "text-[#565656]"
                                                }`}
                                        >
                                            {position}
                                        </span>
                                    </div>

                                    <div
                                        className="w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 bg-[#121213]"
                                        style={{ borderColor: rank.color + "88" }}
                                    >
                                        <span
                                            className="text-xs font-bold"
                                            style={{ color: rank.color }}
                                        >
                                            {player.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#d7dadc] truncate">
                                            {player.name}
                                        </p>
                                        <p
                                            className="text-[10px] font-medium uppercase tracking-wider"
                                            style={{ color: rank.color }}
                                        >
                                            {rank.label}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Trophy className="w-3.5 h-3.5" style={{ color: rank.color }} />
                                        <span
                                            className="text-sm font-bold tabular-nums"
                                            style={{ color: rank.color }}
                                        >
                                            {player.cups}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
