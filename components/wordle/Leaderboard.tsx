"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, X, Crown, Loader2 } from "lucide-react";
import { getRank } from "@/utils/getRank";

import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase-client";

import { useAuth } from "@/hooks/use-auth";
import AuthRequiredModal from "../auth/AuthGate";

export interface LeaderboardPlayer {
    id: string;
    name: string;
    cups: number;
    photoURL?: string | null;
}

interface LeaderboardProps {
    onClose: () => void;
    players?: LeaderboardPlayer[];
    top?: number;
    requireAuth?: boolean;
}

export default function Leaderboard({
    onClose,
    players,
    top = 100,
    requireAuth = true,
}: LeaderboardProps) {
    const { user, authLoading } = useAuth();
    const [showAuth, setShowAuth] = useState(false);

    const [data, setData] = useState<LeaderboardPlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!requireAuth) return;
        if (!authLoading) setShowAuth(!user);
    }, [authLoading, user, requireAuth]);

    useEffect(() => {
        const deps = getFirebase();
        if (!deps) return;

        if (requireAuth && !user) {
            setData([]);
            setLoading(false);
            return;
        }

        const { db } = deps;
        const q = query(
            collection(db, "leaderboard"),
            orderBy("cups", "desc"),
            limit(top)
        );

        setLoading(true);
        const unsub = onSnapshot(
            q,
            (snap) => {
                const arr: LeaderboardPlayer[] = snap.docs.map((doc) => {
                    const d: any = doc.data();
                    return {
                        id: doc.id,
                        name: d.nickname ?? d.name ?? "Jugador",
                        cups: typeof d.cups === "number" ? d.cups : 0,
                        photoURL: d.photoURL ?? null,
                    };
                });
                setData(arr);
                setLoading(false);
            },
            (err) => {
                console.error("[LEADERBOARD] Firestore error:", err);
                setData([]);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user, top, requireAuth]);

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
    }, [isAutoScrolling, data.length]);

    const handleUserScroll = () => {
        setIsAutoScrolling(false);
        const timeout = setTimeout(() => setIsAutoScrolling(true), 4000);
        return () => clearTimeout(timeout);
    };

    if (requireAuth && !user) {
        return <>{showAuth && <AuthRequiredModal onClose={() => setShowAuth(false)} />}</>;
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-background border border-border rounded-xl w-full max-w-md p-8 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cargando leaderboard…</span>
                </div>
            </div>
        );
    }

    const list = (players ?? data).slice().sort((a, b) => b.cups - a.cups);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-xl w-full max-w-md flex flex-col max-h=[85dvh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-[#b59f3b]" />
                        <h2 className="text-foreground font-bold text-base tracking-wide">Top mejores jugadores</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted'foreground hover:text-foreground transition-colors p-1"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="shrink-0 px-5 pt-5 pb-3">
                    <div className="flex items-end justify-center gap-3">
                        {list[1] && (
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background"
                                    style={{ borderColor: getRank(list[1].cups).color }}
                                >
                                    <span className="text-sm font-bold" style={{ color: getRank(list[1].cups).color }}>
                                        {list[1].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[64px]">
                                    {list[1].name}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(list[1].cups).color }} />
                                    <span className="text-[10px] font-bold tabular-nums" style={{ color: getRank(list[1].cups).color }}>
                                        {list[1].cups}
                                    </span>
                                </div>
                                <div className="w-14 h-14 bg-muted/40 border border-border rounded-t-md flex items-center justify-center">
                                    <span className="text-lg font-bold text-muted-foreground">2</span>
                                </div>
                            </div>
                        )}

                        {list[0] && (
                            <div className="flex flex-col items-center gap-1.5 -mt-4">
                                <Crown className="w-5 h-5 text-[#fbbf24]" />
                                <div
                                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-background"
                                    style={{ borderColor: getRank(list[0].cups).color }}
                                >
                                    <span className="text-base font-bold" style={{ color: getRank(list[0].cups).color }}>
                                        {list[0].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-semibold truncate max-w-[72px]">
                                    {list[0].name}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(list[0].cups).color }} />
                                    <span className="text-[11px] font-bold tabular-nums" style={{ color: getRank(list[0].cups).color }}>
                                        {list[0].cups}
                                    </span>
                                </div>
                                <div className="w-14 h-20 bg-muted/10 border border-[#fbbf24]/40 rounded-t-md flex items-center justify-center">
                                    <span className="text-xl font-bold text-[#fbbf24]">1</span>
                                </div>
                            </div>
                        )}

                        {list[2] && (
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background"
                                    style={{ borderColor: getRank(list[2].cups).color }}
                                >
                                    <span className="text-sm font-bold" style={{ color: getRank(list[2].cups).color }}>
                                        {list[2].name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[64px]">
                                    {list[2].name}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <Trophy className="w-3 h-3" style={{ color: getRank(list[2].cups).color }} />
                                    <span className="text-[10px] font-bold tabular-nums" style={{ color: getRank(list[2].cups).color }}>
                                        {list[2].cups}
                                    </span>
                                </div>
                                <div className="w-14 h-10 bg-muted/10 border border-[#cd7f32]/40 rounded-t-md flex items-center justify-center">
                                    <span className="text-lg font-bold text-[#cd7f32]">3</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 shrink-0">
                    <div className="border-t border-muted" />
                    <div className="flex items-center justify-between py-2.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            Clasificación completa
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{list.length} jugadores</span>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto min-h-0 px-5 pb-5"
                    onTouchStart={handleUserScroll}
                    onWheel={handleUserScroll}
                >
                    {list.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">Aún no hay jugadores en el leaderboard</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {list.map((player, idx) => {
                                const rank = getRank(player.cups);
                                const position = idx + 1;
                                const isTop3 = position <= 3;
                                const posColors = ["text-[#fbbf24]", "text-[#9ca3af]", "text-[#cd7f32]"];

                                return (
                                    <div
                                        key={`${player.id}-${idx}`}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isTop3 ? "bg-background border-border" : "bg-background border-border"
                                            }`}
                                    >
                                        <div className="w-7 flex items-center justify-center shrink-0">
                                            <span
                                                className={`text-sm font-bold tabular-nums ${isTop3 ? posColors[position - 1] : "text-muted-foreground"
                                                    }`}
                                            >
                                                {position}
                                            </span>
                                        </div>

                                        <div
                                            className="w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 bg-background"
                                            style={{ borderColor: rank.color + "88" }}
                                            title={player.name}
                                        >
                                            <span className="text-xs font-bold" style={{ color: rank.color }}>
                                                {player.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-muted-foreground truncate">{player.name}</p>
                                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: rank.color }}>
                                                {rank.label}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <Trophy className="w-3.5 h-3.5" style={{ color: rank.color }} />
                                            <span className="text-sm font-bold tabular-nums" style={{ color: rank.color }}>
                                                {player.cups}
                                            </span>
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