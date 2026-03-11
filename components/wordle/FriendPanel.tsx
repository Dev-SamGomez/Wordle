"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Loader2, Trophy, TrendingUp, TrendingDown, Minus, UserPlus, Swords, History } from "lucide-react";
import { getFirebase } from "@/lib/firebase-client";
import { collection, onSnapshot, query, where, documentId } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import {
    onFriendsSnapshot,
    onIncomingFriendRequestsSnapshot,
    respondFriendRequest,
    searchUsersByNicknameLowerPrefix,
    sendFriendRequest as sendFriendRequestUtil,
    onOutgoingFriendRequestsSnapshot,
} from "@/utils/social";
import { acceptChallengeAndJoin, onIncomingChallengesSnapshot, onOutgoingChallengesSnapshot, rejectChallenge, sendChallengeWithRoom } from "@/utils/challenges";
import { useMultiplayer } from "@/hooks/use-multiplayergame";
import CompetitiveRecord from "./HistoryCompetitive";

type Props = { game: ReturnType<typeof useMultiplayer> };
type FriendRow = {
    uid: string;
    nickname: string;
    nicknameLower?: string;
    cups: number;
    trend: "up" | "down" | "flat";
    photoURL?: string | null;
    presence?: "online" | "offline" | "playing" | "busy";
};

function chunk<T>(arr: T[], size = 10): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}
const normalizeUidList = (uids: string[]): string[] => Array.from(new Set(uids)).sort();
const sameSet = (a: string[], b: string[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

const PresenceDot = ({ state }: { state?: string }) => {
    const colors = {
        online: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
        playing: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]",
        busy: "bg-amber-500",
        offline: "bg-slate-500",
    };
    return <div className={`w-2.5 h-2.5 rounded-full ${colors[state as keyof typeof colors] || colors.offline}`} />;
};

const TrendIcon = (t: "up" | "down" | "flat") =>
    t === "up" ? (
        <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : t === "down" ? (
        <TrendingDown className="w-4 h-4 text-rose-400" />
    ) : (
        <Minus className="w-4 h-4 text-slate-500" />
    );

export default function FriendsPanel({ game }: Props) {
    const { user } = useAuth();
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;
    const [q, setQ] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const lastSearchKeyRef = useRef<string>("");
    const [friendUids, setFriendUids] = useState<string[]>([]);
    const [friends, setFriends] = useState<Record<string, FriendRow>>({});
    const [incomingReqs, setIncomingReqs] = useState<any[]>([]);
    const [outgoingReqs, setOutgoingReqs] = useState<any[]>([]);
    const [sendingTo, setSendingTo] = useState<Set<string>>(new Set());
    const [incomingChallenges, setIncomingChallenges] = useState<any[]>([]);
    const [outgoingChallenges, setOutgoingChallenges] = useState<any[]>([]);
    const [showHistoryCompetitive, setShowHistoryCompetitive] = useState(false);
    const [uid, setUid] = useState<string | null>(null)
    const [toasts, setToasts] = useState<{ id: number; kind: "success" | "error"; msg: string }[]>([]);
    const notifiedChallengesRef = useRef<Set<string>>(new Set());
    const pushToast = (t: any) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3000);
    };

    const chunkWatchersRef = useRef<Map<string, () => void>>(new Map());

    const aliveRef = useRef(true);

    useEffect(() => {
        aliveRef.current = true;
        return () => { aliveRef.current = false; };
    }, []);

    useEffect(() => {
        if (!user?.uid) {
            notifiedChallengesRef.current.clear();
            return;
        }
        const pendingIncoming = incomingChallenges.filter(
            (c: any) => c.status === "pending" && c.toUid === user.uid
        );

        for (const ch of pendingIncoming) {
            const id = ch.id as string;
            if (notifiedChallengesRef.current.has(id)) continue;

            notifiedChallengesRef.current.add(id);

            const senderName =
                ch.from?.nickname ??
                ch.fromNickname ??
                ch.sender?.nickname ??
                "Jugador";
            const roomCode =
                ch.roomCode ?? ch.code ?? ch.room?.code ?? undefined;

            const msg = roomCode
                ? `${senderName} te desafió (código: ${roomCode})`
                : `${senderName} te ha enviado un desafío`;

            pushToast({ kind: "success", msg });
        }

    }, [incomingChallenges, user?.uid]);

    const cleanupAllFriendChunkWatchers = () => {
        for (const [, off] of chunkWatchersRef.current) {
            try { off(); } catch { }
        }
        chunkWatchersRef.current.clear();
    }

    useEffect(() => {
        return () => {
            cleanupAllFriendChunkWatchers();
        };
    }, [])

    useEffect(() => {
        if (user?.uid) return;
        cleanupAllFriendChunkWatchers();
        setFriendUids([]);
        setFriends({});
        setIncomingReqs([]);
        setOutgoingReqs([]);
        setIncomingChallenges([]);
        setOutgoingChallenges([]);
    }, [user?.uid]);

    useEffect(() => {
        let unsub: undefined | (() => void);
        let localAlive = true;
        if (user?.uid) {
            unsub = onFriendsSnapshot((uids) => {
                if (!aliveRef.current || !localAlive) return;
                const normalized = normalizeUidList(uids);
                setFriendUids((prev) => (sameSet(prev, normalized) ? prev : normalized));
            });
        } else {
            setFriendUids([]);
        }
        return () => {
            localAlive = false;
            try { unsub?.(); } catch { }
        };
    }, [user?.uid]);

    useEffect(() => {
        let localAlive = true;
        if (!user?.uid) {
            cleanupAllFriendChunkWatchers();
            return;
        }
        if (!db) return;
        const normalized = normalizeUidList(friendUids);
        const newChunks = chunk(normalized, 30);
        const currentKeys = new Set(chunkWatchersRef.current.keys());
        const nextKeys = new Set(newChunks.map((g) => g.join("|")));
        for (const key of currentKeys) {
            if (!nextKeys.has(key)) {
                try { chunkWatchersRef.current.get(key)?.(); } finally { chunkWatchersRef.current.delete(key); }
            }
        }
        for (const group of newChunks) {
            const key = group.join("|");
            if (chunkWatchersRef.current.has(key)) continue;
            const qLb = query(collection(db, "leaderboard"), where(documentId(), "in", group));
            const qPr = query(collection(db, "presence"), where(documentId(), "in", group));
            const offLb = onSnapshot(qLb, (snap) => {
                if (!aliveRef.current || !localAlive) return;
                const updates: Record<string, FriendRow> = {};
                snap.forEach((d) => {
                    const data: any = d.data() ?? {};
                    const uid = d.id;
                    updates[uid] = {
                        uid,
                        nickname: data.nickname ?? "Jugador",
                        nicknameLower: data.nicknameLower ?? undefined,
                        cups: data.cups ?? 0,
                        trend: (data.trend ?? "flat") as "up" | "down" | "flat",
                        photoURL: data.photoURL ?? null,
                        presence: undefined,
                    };
                });
                setFriends((prev) => {
                    const copy = { ...prev };
                    for (const id of Object.keys(updates)) {
                        const existing = copy[id];
                        copy[id] = { ...updates[id], presence: existing?.presence ?? updates[id].presence ?? "offline" };
                    }
                    return copy;
                });
            });
            const offPr = onSnapshot(qPr, (snap) => {
                if (!aliveRef.current || !localAlive) return;
                const presences: Record<string, any> = {};
                snap.forEach((d) => {
                    const data: any = d.data() ?? {};
                    presences[d.id] = data.state ?? "offline";
                });
                setFriends((prev) => {
                    const copy = { ...prev };
                    for (const id of Object.keys(presences)) {
                        const p = copy[id];
                        if (!p) continue;
                        copy[id] = { ...p, presence: presences[id] };
                    }
                    return copy;
                });
            });
            chunkWatchersRef.current.set(key, () => {
                try { offLb(); } catch { }
                try { offPr(); } catch { }
            });
        }
        return () => {
            localAlive = false;
        };
    }, [db, friendUids, user?.uid])

    const reqUnsubsRef = useRef<{ in?: () => void; out?: () => void }>({});
    useEffect(() => {
        if (reqUnsubsRef.current.in) reqUnsubsRef.current.in!();
        if (reqUnsubsRef.current.out) reqUnsubsRef.current.out!();
        let localAlive = true;
        if (!user?.uid) {
            setIncomingReqs([]);
            setOutgoingReqs([]);
            return;
        }
        const offIn = onIncomingFriendRequestsSnapshot((v: any[]) => {
            if (!aliveRef.current || !localAlive) return;
            setIncomingReqs(v);
        }, { enrich: true });
        const offOut = onOutgoingFriendRequestsSnapshot((v: any[]) => {
            if (!aliveRef.current || !localAlive) return;
            setOutgoingReqs(v);
        }, { enrich: false });

        reqUnsubsRef.current.in = offIn ?? undefined;
        reqUnsubsRef.current.out = offOut ?? undefined;

        return () => { localAlive = false; };
    }, [user?.uid]);

    const outgoingToSet = useMemo(() => new Set<string>(outgoingReqs.map((r: any) => r.toUid)), [outgoingReqs]);
    const incomingByFrom = useMemo(() => new Map<string, any>(incomingReqs.map((r: any) => [r.fromUid, r])), [incomingReqs]);
    const incomingFromSet = useMemo(() => new Set<string>(incomingReqs.map((r: any) => r.fromUid)), [incomingReqs]);
    const friendSet = useMemo(() => new Set(friendUids), [friendUids]);
    const friendRows = useMemo(() => Object.values(friends).sort((a, b) => b.cups - a.cups), [friends]);

    const doSearch = async () => {
        if (!q.trim() || searchLoading) return;
        const key = `${q.trim().toLowerCase()}::25`;
        if (key === lastSearchKeyRef.current) return;
        lastSearchKeyRef.current = key;
        setSearchLoading(true);
        try {
            const res = await searchUsersByNicknameLowerPrefix(q, 25);
            const me = user?.uid;
            setSearchResults(res.filter((r: any) => r.uid !== me));
        } finally { setSearchLoading(false); }
    };

    const handleSend = async (targetUid: string) => {
        setSendingTo((prev) => new Set(prev).add(targetUid));
        try {
            await sendFriendRequestUtil(targetUid);
            pushToast({ kind: "success", msg: "Solicitud enviada" });
        } catch (err: any) {
            pushToast({ kind: "error", msg: "Error al enviar solicitud" });
        } finally {
            setSendingTo((prev) => { const cp = new Set(prev); cp.delete(targetUid); return cp; });
        }
    };

    useEffect(() => {
        let localAlive = true;
        if (!user?.uid) {
            setIncomingChallenges([]);
            setOutgoingChallenges([]);
            return;
        }
        const offIn = onIncomingChallengesSnapshot((v: any[]) => {
            if (!aliveRef.current || !localAlive) return;
            setIncomingChallenges(v);
        });
        const offOut = onOutgoingChallengesSnapshot((v: any[]) => {
            if (!aliveRef.current || !localAlive) return;
            setOutgoingChallenges(v);
        });
        return () => {
            offIn?.();
            offOut?.();
            localAlive = false;
        };
    }, [user?.uid]);

    const pendingOutgoingTo = useMemo(() => new Set<string>(outgoingChallenges.filter(c => c.status === 'pending').map(c => c.toUid)), [outgoingChallenges]);
    const pendingIncomingFrom = useMemo(() => new Map<string, any>(incomingChallenges.filter(c => c.status === 'pending').map(c => [c.fromUid, c])), [incomingChallenges]);

    const handleChallenge = async (uid: string) => {
        if (pendingOutgoingTo.has(uid)) {
            pushToast({ kind: "success", msg: "Ya se envió el desafío" });
            return;
        }
        try {
            const code = await sendChallengeWithRoom(uid, game.createRoomAndWaitCode);
            pushToast({ kind: "success", msg: `Desafío enviado (código: ${code})` });
        } catch (e: any) { pushToast({ kind: "error", msg: e?.message }); }
    }

    const handleAcceptChallenge = async (chId: string) => {
        try { await acceptChallengeAndJoin(chId, game.joinRoom); } catch (e: any) { pushToast({ kind: "error", msg: e?.message }); }
    }

    const handleRejectChallenge = async (chId: string) => {
        try {
            await rejectChallenge(chId);
            pushToast({ kind: "success", msg: "Se rechazó el desafío" });
        } catch (e: any) {
            pushToast({ kind: "error", msg: e?.message || "No se pudo rechazar el desafío" });
        }
    };

    return (
        <div className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl text-foreground">
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 ml-1">Buscar Jugadores</h3>
                    <div className="relative group">
                        <input
                            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm transition-all focus:border-[#538d4e] focus:ring-2 focus:ring-[#538d4e]/20 outline-none"
                            placeholder="Introduce un nickname..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && doSearch()}
                        />
                        <button
                            onClick={doSearch}
                            disabled={searchLoading || !q.trim()}
                            className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-[#538d4e] hover:border-[#4e8349] disabled:opacity-50 disabled:bg-slate-800 transition-colors"
                        >
                            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin text-foreground" /> : <Search className="w-4 h-4 text-foreground" />}
                        </button>
                    </div>

                    {q.trim() && searchResults.length > 0 && (
                        <div className="mt-3 rounded-xl border border-border bg-background/30 divide-y divide-slate-800 overflow-hidden">
                            {searchResults.map((u: any) => (
                                <div key={u.uid} className="flex items-center gap-3 p-3 hover:bg-muted transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-foreground shadow-lg overflow-hidden">
                                        {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : (u.nickname || "J").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{u.nickname}</p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
                                            <Trophy className="w-3 h-3 text-amber-500" /> {u.cups ?? 0}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSend(u.uid)}
                                        disabled={friendSet.has(u.uid) || outgoingToSet.has(u.uid) || sendingTo.has(u.uid)}
                                        className="p-2 rounded-lg border border-foreground/40 hover:bg-muted-foreground/40 disabled:opacity-40 transition-all"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {incomingReqs.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 ml-1 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Pendientes ({incomingReqs.length})
                        </h3>
                        <div className="space-y-2">
                            {incomingReqs.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <span className="text-sm font-medium">De: <span className="font-bold">{r.sender?.nickname ?? "Jugador"}</span></span>
                                    <div className="flex gap-2">
                                        <button onClick={() => respondFriendRequest(r.id, true)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-muted rounded-lg transition-colors">ACEPTAR</button>
                                        <button onClick={() => respondFriendRequest(r.id, false)} className="px-3 py-1.5 bg-muted-foreground hover:bg-foreground text-[11px] font-bold text-muted rounded-lg transition-colors">RECHAZAR</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tus Amigos</h3>
                        <span className="text-[10px] bg-muted-foreground px-2 py-0.5 rounded-full text-muted">{friendRows.length}</span>
                    </div>

                    {friendRows.length === 0 ? (
                        <div className="text-center py-10 rounded-2xl border border-dashed border-border-800">
                            <p className="text-sm text-muted-foreground italic">Tu lista está vacía. ¡Busca nuevos rivales!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {friendRows.map((fr) => (
                                <div key={fr.uid} className="group relative flex items-center gap-3 p-3 rounded-2xl bg-background-900/40 border border-border-800/50 hover:border-border-700 hover:bg-background-800/30 transition-all duration-300">

                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden border-2 border-border">
                                            {fr.photoURL ? <img src={fr.photoURL} alt="" className="w-full h-full object-cover" /> : fr.nickname.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-border-950 rounded-full">
                                            <PresenceDot state={fr.presence} />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold truncate group-hover:text-foreground transition-colors">{fr.nickname}</p>
                                            {TrendIcon(fr.trend)}
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1">
                                            {fr.presence ?? "offline"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end pr-1">
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Trophy className="w-3.5 h-3.5 fill-amber-500/20" />
                                            <span className="text-sm font-black tabular-nums">{fr.cups}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 ml-2">
                                        {(() => {
                                            const incoming = pendingIncomingFrom.get(fr.uid);
                                            const isOutgoingPending = pendingOutgoingTo.has(fr.uid);

                                            if (incoming) {
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAcceptChallenge(incoming.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-foreground p-2 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                                                            title="Aceptar Desafío"
                                                        >
                                                            <Swords className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectChallenge(incoming.id)}
                                                            className="bg-rose-600 hover:bg-rose-500 text-foreground p-2 rounded-xl transition-all shadow-lg shadow-rose-900/20"
                                                            title="Rechazar Desafío"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <button
                                                    onClick={() => handleChallenge(fr.uid)}
                                                    disabled={isOutgoingPending}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-muted p-2 rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-indigo-900/20"
                                                    title={isOutgoingPending ? "Ya se envió el desafío" : "Desafiar"}
                                                >
                                                    <Swords className="h-4 w-4" />
                                                </button>
                                            );
                                        })()}
                                        <button
                                            onClick={() => { setUid(fr.uid); setShowHistoryCompetitive(true); }}
                                            className="bg-muted-foreground hover:bg-muted-foreground/80 text-muted p-2 rounded-xl transition-all"
                                            title="Ver Historial"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
                px-4 py-2 rounded font-bold text-sm shadow-2xl
                transition-all duration-300 animate-in fade-in slide-in-from-top-4
                ${t.kind === "success" ? "bg-[hsl(var(--tile-correct))] text-foreground" : "bg-background text-foreground"}
            `}
                    >
                        {t.msg}
                    </div>
                ))}
            </div>

            {showHistoryCompetitive && <CompetitiveRecord onClose={() => { setShowHistoryCompetitive(false); setUid(null); }} uid={uid} />}
        </div>
    );
}