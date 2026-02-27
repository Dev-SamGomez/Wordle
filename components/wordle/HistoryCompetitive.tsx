"use client";

import { useEffect, useState } from "react";
import { Trophy, Swords, X } from "lucide-react";
import { CompetitiveProfile } from "@/data/competitive-res";
import { loadCompetitiveProfile } from "@/utils/competitive";
import { RANKS } from "@/data/ranks";
import { formatDate } from "@/utils/formatDate";
import { getRankInfo } from "@/utils/getRank";
import { resultConfig } from "@/data/result-config";

interface CompetitiveRecordProps {
    onClose: () => void;
}

const MAX_CUPS = 3600;

export default function CompetitiveRecord({ onClose }: CompetitiveRecordProps) {
    const [profile, setProfile] = useState<CompetitiveProfile | null>(null);

    useEffect(() => {
        setProfile(loadCompetitiveProfile());
    }, []);

    if (!profile) return null;

    const rank = getRankInfo(profile.cups);
    const winRate =
        profile.gamesPlayed > 0
            ? Math.round((profile.wins / profile.gamesPlayed) * 100)
            : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-lg w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#3a3a3c]">
                    <h2 className="text-white font-bold text-base tracking-wide">
                        Registro Competitivo
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#818384] hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="shrink-0">
                    <div className="px-5 pt-5 pb-4">
                        <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-5 flex flex-col items-center gap-3">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{
                                    background: `radial-gradient(circle at 30% 30%, ${rank.color}44, ${rank.color}11)`,
                                    border: `2px solid ${rank.color}`,
                                }}
                            >
                                <Trophy className="w-8 h-8" style={{ color: rank.color }} />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span
                                    className="text-3xl font-bold tabular-nums"
                                    style={{ color: rank.color }}
                                >
                                    {profile.cups}
                                </span>
                                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: rank.color }}>
                                    {rank.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pb-4">
                        <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-4">
                            <h3 className="text-[11px] text-[#818384] uppercase tracking-wider mb-4">
                                ligas
                            </h3>

                            <div className="relative mx-3 mb-1">
                                <div className="h-2 bg-[#3a3a3c] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min((profile.cups / MAX_CUPS) * 100, 100)}%`,
                                            background: `linear-gradient(90deg, ${rank.color}cc, ${rank.color})`,
                                        }}
                                    />
                                </div>

                                {RANKS.map((r) => {
                                    const pct = (r.min / MAX_CUPS) * 100;
                                    const reached = profile.cups >= r.min;
                                    return (
                                        <div
                                            key={r.label}
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                                            style={{ left: `${pct}%` }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full border-2 cursor-pointer"
                                                style={{
                                                    borderColor: r.color,
                                                    backgroundColor: reached ? r.color : "#1a1a1b",
                                                }}
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#2a2a2b] border border-[#3a3a3c] rounded text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                                                <span className="text-[10px] font-bold block" style={{ color: r.color }}>
                                                    {r.label}
                                                </span>
                                                <span className="text-[9px] text-[#818384] tabular-nums">
                                                    {r.min}+ copas
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between mx-1 mt-3">
                                {RANKS.map((r) => {
                                    const isActive = rank.label === r.label;
                                    const reached = profile.cups >= r.min;
                                    return (
                                        <div key={r.label} className="flex flex-col items-center gap-0.5">
                                            <span
                                                className="text-[8px] sm:text-[9px] font-semibold uppercase leading-none"
                                                style={{
                                                    color: isActive ? r.color : reached ? r.color + "99" : "#565656",
                                                }}
                                            >
                                                {r.label}
                                            </span>
                                            <span
                                                className="text-[7px] sm:text-[8px] tabular-nums leading-none"
                                                style={{
                                                    color: isActive ? r.color + "cc" : "#565656",
                                                }}
                                            >
                                                {r.min}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {(() => {
                                const nextRank = RANKS.find((r) => r.min > profile.cups);
                                if (!nextRank) {
                                    return (
                                        <p className="text-[11px] text-center mt-3" style={{ color: rank.color }}>
                                            Rango maximo alcanzado
                                        </p>
                                    );
                                }
                                const cupsNeeded = nextRank.min - profile.cups;
                                return (
                                    <p className="text-[11px] text-[#818384] text-center mt-3">
                                        Faltan{" "}
                                        <span className="font-bold tabular-nums" style={{ color: nextRank.color }}>
                                            {cupsNeeded}
                                        </span>{" "}
                                        copas para{" "}
                                        <span className="font-bold" style={{ color: nextRank.color }}>
                                            {nextRank.label}
                                        </span>
                                    </p>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="px-5 pb-4">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-3 flex flex-col items-center">
                                <span className="text-xl font-bold text-[#538d4e] tabular-nums">
                                    {profile.wins}
                                </span>
                                <span className="text-[10px] text-[#818384] uppercase tracking-wider">
                                    Victorias
                                </span>
                            </div>
                            <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-3 flex flex-col items-center">
                                <span className="text-xl font-bold text-[#d32f2f] tabular-nums">
                                    {profile.losses}
                                </span>
                                <span className="text-[10px] text-[#818384] uppercase tracking-wider">
                                    Derrotas
                                </span>
                            </div>
                            <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-3 flex flex-col items-center">
                                <span className="text-xl font-bold text-[#b59f3b] tabular-nums">
                                    {profile.draws}
                                </span>
                                <span className="text-[10px] text-[#818384] uppercase tracking-wider">
                                    Empates
                                </span>
                            </div>
                            <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-3 flex flex-col items-center">
                                <span className="text-xl font-bold text-[#d7dadc] tabular-nums">
                                    {profile.gamesPlayed}
                                </span>
                                <span className="text-[10px] text-[#818384] uppercase tracking-wider">
                                    Partidas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pb-4">
                        <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-[#818384] uppercase tracking-wider">
                                    Win Rate
                                </span>
                                <span className="text-sm font-bold text-[#d7dadc] tabular-nums">
                                    {winRate}%
                                </span>
                            </div>
                            <div className="h-2 bg-[#3a3a3c] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#538d4e] rounded-full transition-all duration-500"
                                    style={{ width: `${winRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-5 pb-2">
                        <h3 className="text-[11px] text-[#818384] uppercase tracking-wider">
                            Historial de partidas
                        </h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-5">
                    {profile.history.length === 0 ? (
                        <div className="text-center py-8">
                            <Swords className="w-8 h-8 text-[#3a3a3c] mx-auto mb-2" />
                            <p className="text-[#818384] text-sm">
                                Sin partidas registradas
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {[...profile.history]
                                .sort((a, b) => b.ts - a.ts)
                                .map((item, i) => {
                                    const cfg = resultConfig[item.result];
                                    const Icon = cfg.icon;
                                    return (
                                        <div
                                            key={`${item.ts}-${i}`}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
                                        >
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${cfg.bg}`}>
                                                <Icon className={`w-4 h-4 ${cfg.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-semibold ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>
                                                        {item.delta > 0 ? "+" : ""}
                                                        {item.delta}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-[#818384]">
                                                        {formatDate(item.ts)}
                                                    </span>
                                                    {item.roomCode && (
                                                        <span className="text-[10px] text-[#818384] font-mono">
                                                            Sala: {item.roomCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
