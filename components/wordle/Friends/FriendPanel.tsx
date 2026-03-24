"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Trophy, UserPlus, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { getFirebase } from "@/lib/firebase-client";
import { collection, onSnapshot, query, where, documentId, enableNetwork, disableNetwork } from "firebase/firestore";
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
import CompetitiveRecord from "../HistoryCompetitive";
import { usePresenceFirestore } from "@/hooks/use-presence";
import { FriendRow } from "@/data/friend-row";
import FriendCard from "./FriendCard";
import { useToast } from "@/context/ToastContext";

type Props = { game: ReturnType<typeof useMultiplayer> };

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

export default function FriendsPanel({ game }: Props) {
    const { user } = useAuth();
    const { pushToast } = useToast();
    const presence = usePresenceFirestore();
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;
    const [q, setQ] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const lastSearchKeyRef = useRef<string>("");
    const searchTokenRef = useRef(0);
    const [friendUids, setFriendUids] = useState<string[]>([]);
    const [friends, setFriends] = useState<Record<string, FriendRow>>({});
    const [incomingReqs, setIncomingReqs] = useState<any[]>([]);
    const [outgoingReqs, setOutgoingReqs] = useState<any[]>([]);
    const [sendingTo, setSendingTo] = useState<Set<string>>(new Set());
    const [incomingChallenges, setIncomingChallenges] = useState<any[]>([]);
    const [outgoingChallenges, setOutgoingChallenges] = useState<any[]>([]);
    const [showHistoryCompetitive, setShowHistoryCompetitive] = useState(false);
    const [uid, setUid] = useState<string | null>(null)
    const notifiedChallengesRef = useRef<Set<string>>(new Set());

    const chunkWatchersRef = useRef<Map<string, () => void>>(new Map());
    const allUnsubsRef = useRef<Set<() => void>>(new Set());
    const addUnsub = (fn?: () => void) => { if (fn) allUnsubsRef.current.add(fn); };
    const flushAllUnsubs = () => {
        for (const off of allUnsubsRef.current) { try { off(); } catch { } }
        allUnsubsRef.current.clear();
    };
    const aliveRef = useRef(true);
    useEffect(() => {
        if (!db) return;
        if (!user?.uid) {
            disableNetwork(db).catch(() => { });
        } else {
            enableNetwork(db).catch(() => { });
        }
    }, [db, user?.uid]);

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
            flushAllUnsubs();
        };
    }, [])

    useEffect(() => {
        if (user?.uid) return;
        cleanupAllFriendChunkWatchers();
        flushAllUnsubs();
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
            addUnsub(unsub);
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
                const now = Date.now();
                const STALE_MS = 180_000;
                snap.forEach((d) => {
                    const data: any = d.data() ?? {};
                    const lastSeenMs =
                        typeof data.lastSeen?.toMillis === "function" ? data.lastSeen.toMillis() :
                            typeof data.lastSeen === "number" ? data.lastSeen : 0;
                    const isStale = !lastSeenMs || (now - lastSeenMs) > STALE_MS;
                    presences[d.id] = isStale ? "offline" : (data.state ?? "offline");
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
            addUnsub(offLb);
            addUnsub(offPr);
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
        addUnsub(offIn);
        addUnsub(offOut);
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
        console.debug("[FriendsPanel] doSearch called. user?", !!user?.uid);
        if (!user?.uid) return;
        if (!q.trim() || searchLoading) return;
        const key = `${q.trim().toLowerCase()}::25`;
        if (key === lastSearchKeyRef.current) return;
        lastSearchKeyRef.current = key;
        setSearchLoading(true);
        const myToken = ++searchTokenRef.current;
        try {
            const res = await searchUsersByNicknameLowerPrefix(q, 25);
            const me = user?.uid;
            if (myToken !== searchTokenRef.current || !user?.uid) return;
            setSearchResults(res.filter((r: any) => r.uid !== me));
        } finally {
            if (myToken === searchTokenRef.current) setSearchLoading(false);
        }
    };

    const handleSend = async (targetUid: string) => {
        if (!user?.uid) { pushToast({ kind: "error", msg: "Inicia sesión para enviar solicitudes" }); return; }
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
        console.debug("[FriendsPanel] auth =", user?.uid ?? "NO_AUTH");
    }, [user?.uid]);

    useEffect(() => {
        let localAlive = true;
        if (!user?.uid) {
            setIncomingChallenges([]);
            setOutgoingChallenges([]);
            setQ("");
            setSearchResults([]);
            setSearchLoading(false);
            lastSearchKeyRef.current = "";
            searchTokenRef.current++;
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
        addUnsub(offIn);
        addUnsub(offOut);
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
            presence.setBusy()
            const { roomCode, challengeId } = await sendChallengeWithRoom(uid, game.createRoomAndWaitCode);
            game.setCurrentChallengeId(challengeId);
            pushToast({ kind: "success", msg: `Desafío enviado (código: ${roomCode})` });
        } catch (e: any) { pushToast({ kind: "error", msg: e?.message }); }
    }

    const handleAcceptChallenge = async (chId: string) => {
        try {
            presence.setBusy()
            await acceptChallengeAndJoin(chId, game.joinRoom);
        } catch (e: any) { pushToast({ kind: "error", msg: e?.message }); }
    }

    const handleRejectChallenge = async (chId: string) => {
        const ch = incomingChallenges.find(c => c.id === chId);
        if (!ch) return;

        await rejectChallenge(chId);

        game.rejectRoom(ch.roomCode);

        pushToast({ kind: "success", msg: "Se rechazó el desafío" });
    };

    return (
        <TooltipProvider>
            <div className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl text-foreground">
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 ml-1 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5" />
                            Buscar Jugadores
                        </h3>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors">
                                <Users className="w-4 h-4" />
                            </div>
                            <input
                                disabled={!user}
                                className="w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-12 py-3 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-background outline-none"
                                placeholder="Introduce un nickname..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={doSearch}
                                        disabled={searchLoading || !q.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:bg-secondary transition-all hover:scale-105 active:scale-95"
                                    >
                                        {searchLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Search className="w-4 h-4 text-white" />}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Buscar</TooltipContent>
                            </Tooltip>
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
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                Tus Amigos
                            </h3>
                            <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-600/30">{friendRows.length}</span>
                        </div>

                        {friendRows.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-secondary/30">
                                <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">Tu lista esta vacia</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Busca nuevos rivales arriba</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {friendRows.filter(fr => fr.presence === "online" || fr.presence === "playing").length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                                Activos ({friendRows.filter(fr => fr.presence === "online" || fr.presence === "playing").length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {friendRows.filter(fr => fr.presence === "online" || fr.presence === "playing").map((fr) => (
                                                <FriendCard
                                                    key={fr.uid}
                                                    fr={fr}
                                                    pendingIncomingFrom={pendingIncomingFrom}
                                                    pendingOutgoingTo={pendingOutgoingTo}
                                                    handleAcceptChallenge={handleAcceptChallenge}
                                                    handleRejectChallenge={handleRejectChallenge}
                                                    handleChallenge={handleChallenge}
                                                    setUid={setUid}
                                                    setShowHistoryCompetitive={setShowHistoryCompetitive}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {friendRows.filter(fr => fr.presence !== "online" && fr.presence !== "playing").length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="h-2 w-2 rounded-full bg-slate-600" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                Desconectados ({friendRows.filter(fr => fr.presence !== "online" && fr.presence !== "playing").length})
                                            </span>
                                        </div>
                                        <div className="space-y-2 opacity-70">
                                            {friendRows.filter(fr => fr.presence !== "online" && fr.presence !== "playing").map((fr) => (
                                                <FriendCard
                                                    key={fr.uid}
                                                    fr={fr}
                                                    pendingIncomingFrom={pendingIncomingFrom}
                                                    pendingOutgoingTo={pendingOutgoingTo}
                                                    handleAcceptChallenge={handleAcceptChallenge}
                                                    handleRejectChallenge={handleRejectChallenge}
                                                    handleChallenge={handleChallenge}
                                                    setUid={setUid}
                                                    setShowHistoryCompetitive={setShowHistoryCompetitive}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {showHistoryCompetitive && <CompetitiveRecord onClose={() => { setShowHistoryCompetitive(false); setUid(null); }} uid={uid} />}
            </div>
        </TooltipProvider>
    );
}
