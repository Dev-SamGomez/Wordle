/* TODO:

Queda pendiente el aceptar partida, ver modo de cambiar sin montar otro hook

*/
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Loader2, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import { getMultiplayerInstance } from "@/lib/multiplayer-context";

type Props = {
    onClose: () => void;
    onViewHistory?: (uid: string) => void;
    onStartMultiplayer: () => void;
};

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

const normalizeUidList = (uids: string[]): string[] => {
    return Array.from(new Set(uids)).sort();
}

const sameSet = (a: string[], b: string[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

const TrendIcon = (t: "up" | "down" | "flat") =>
    t === "up" ? (
        <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden />
    ) : t === "down" ? (
        <TrendingDown className="w-4 h-4 text-red-500" aria-hidden />
    ) : (
        <Minus className="w-4 h-4 text-muted-foreground" aria-hidden />
    );

export default function FriendsPanel({ onClose, onViewHistory, onStartMultiplayer }: Props) {
    const { user } = useAuth();
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;
    const mp = getMultiplayerInstance(); //TODO: Hacer una sola instancia despues
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

    type Toast = { id: number; kind: "success" | "error"; msg: string };
    const [toasts, setToasts] = useState<Toast[]>([]);
    const pushToast = (t: Omit<Toast, "id">) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3000);
    };

    const chunkWatchersRef = useRef<Map<string, () => void>>(new Map());

    useEffect(() => {
        return () => {
            for (const [, off] of chunkWatchersRef.current) try { off(); } catch { }
            chunkWatchersRef.current.clear();
        };
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const off = onFriendsSnapshot((uids) => {
            const normalized = normalizeUidList(uids);
            setFriendUids((prev) => (sameSet(prev, normalized) ? prev : normalized));
        });
        return () => off?.();
    }, [user?.uid]);

    useEffect(() => {
        if (!db) return;

        const normalized = normalizeUidList(friendUids);
        const newChunks = chunk(normalized, 30);

        const currentKeys = new Set(chunkWatchersRef.current.keys());
        const nextKeys = new Set(newChunks.map((g) => g.join("|")));

        for (const key of currentKeys) {
            if (!nextKeys.has(key)) {
                try {
                    chunkWatchersRef.current.get(key)?.();
                } finally {
                    chunkWatchersRef.current.delete(key);
                }
            }
        }

        for (const group of newChunks) {
            const key = group.join("|");
            if (chunkWatchersRef.current.has(key)) continue;

            const qLb = query(collection(db, "leaderboard"), where(documentId(), "in", group));
            const qPr = query(collection(db, "presence"), where(documentId(), "in", group));

            const offLb = onSnapshot(
                qLb,
                (snap) => {
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
                            copy[id] = {
                                ...updates[id],
                                presence: existing?.presence ?? updates[id].presence ?? "offline",
                            };
                        }
                        return copy;
                    });
                },
                (err) => console.error("[leaderboard listen chunk]", group, err)
            );

            const offPr = onSnapshot(
                qPr,
                (snap) => {
                    const presences: Record<string, "online" | "offline" | "playing" | "busy"> = {};
                    snap.forEach((d) => {
                        const data: any = d.data() ?? {};
                        const uid = d.id;
                        presences[uid] = (data.state ?? "offline") as any;
                    });
                    setFriends((prev) => {
                        const copy = { ...prev };
                        for (const id of Object.keys(presences)) {
                            const p = copy[id];
                            if (!p) return copy
                            copy[id] = {
                                uid: id,
                                nickname: p?.nickname ?? "Jugador",
                                cups: p?.cups ?? 0,
                                trend: p?.trend ?? "flat",
                                photoURL: p?.photoURL ?? null,
                                presence: presences[id],
                            };
                        }
                        return copy;
                    });
                },
                (err) => console.error("[presence listen chunk]", group, err)
            );

            chunkWatchersRef.current.set(key, () => {
                try { offLb(); } catch { }
                try { offPr(); } catch { }
            });
        }

        const allowed = new Set(normalized);
        setFriends((prev) => {
            const copy = { ...prev };
            for (const uid of Object.keys(copy)) if (!allowed.has(uid)) delete copy[uid];
            return copy;
        });
    }, [db, friendUids]);

    const reqUnsubsRef = useRef<{ in?: () => void; out?: () => void }>({});

    useEffect(() => {
        if (reqUnsubsRef.current.in) reqUnsubsRef.current.in!();
        if (reqUnsubsRef.current.out) reqUnsubsRef.current.out!();
        reqUnsubsRef.current = {};

        if (!user?.uid) return;

        const offIn = onIncomingFriendRequestsSnapshot(setIncomingReqs, { enrich: true });
        const offOut = onOutgoingFriendRequestsSnapshot(setOutgoingReqs, { enrich: false });
        reqUnsubsRef.current.in = offIn ?? undefined;
        reqUnsubsRef.current.out = offOut ?? undefined;

        return () => {
            if (reqUnsubsRef.current.in) reqUnsubsRef.current.in!();
            if (reqUnsubsRef.current.out) reqUnsubsRef.current.out!();
            reqUnsubsRef.current = {};
        };
    }, [user?.uid]);

    const outgoingToSet = useMemo(
        () => new Set<string>(outgoingReqs.map((r: any) => r.toUid)),
        [outgoingReqs]
    );

    const incomingByFrom = useMemo(
        () => new Map<string, any>(incomingReqs.map((r: any) => [r.fromUid, r])),
        [incomingReqs]
    );

    const incomingFromSet = useMemo(
        () => new Set<string>(incomingReqs.map((r: any) => r.fromUid)),
        [incomingReqs]
    );

    const friendSet = useMemo(() => new Set(friendUids), [friendUids]);

    const friendRows = useMemo(
        () => Object.values(friends).sort((a, b) => b.cups - a.cups),
        [friends]
    );

    const doSearch = async () => {
        if (!q.trim() || searchLoading) return;

        const key = `${q.trim().toLowerCase()}::25`;
        if (key === lastSearchKeyRef.current) {
            return;
        }
        lastSearchKeyRef.current = key;

        setSearchLoading(true);
        try {
            const res = await searchUsersByNicknameLowerPrefix(q, 25);
            const me = user?.uid;
            const filtered = res.filter((r: any) => r.uid !== me);
            setSearchResults(filtered);
        } finally {
            setSearchLoading(false);
        }
    };

    const canSendTo = (uid: string) => {
        if (friendSet.has(uid)) return false;
        if (outgoingToSet.has(uid)) return false;
        if (incomingFromSet.has(uid)) return false;
        if (sendingTo.has(uid)) return false;
        return true;
    }

    const handleSend = async (targetUid: string) => {
        if (!targetUid) {
            pushToast({ kind: "error", msg: "ID de usuario inválido." });
            return;
        }
        if (!canSendTo(targetUid)) return;

        setSendingTo((prev) => {
            const cp = new Set(prev);
            cp.add(targetUid);
            return cp;
        });
        try {
            await sendFriendRequestUtil(targetUid);
            pushToast({ kind: "success", msg: "Solicitud enviada" });
        } catch (err: any) {
            const raw = (err?.message ?? "").toLowerCase();
            let msg = "Error al enviar la solicitud";
            if (raw.includes("no autenticado") || raw.includes("auth")) {
                msg = "Debe iniciar sesión para enviar solicitudes.";
            } else if (raw.includes("no puedes agregarte a ti mismo")) {
                msg = "No puedes agregarte a ti mismo.";
            } else if (raw.includes("ya son amigos") || raw.includes("friend")) {
                msg = "Este usuario ya es tu amigo.";
            } else if (raw.includes("solicitud ya enviada") || raw.includes("duplicate")) {
                msg = "Ya enviaste una solicitud a este usuario.";
            } else if (raw.includes("tienes una solicitud entrante")) {
                msg = "Este usuario ya te envió una solicitud. Revísala en “Solicitudes”.";
            } else if (raw.includes("permission-denied")) {
                msg = "Permisos insuficientes. Revisa tus reglas de Firestore.";
            }
            pushToast({ kind: "error", msg });
        } finally {
            setSendingTo((prev) => {
                const cp = new Set(prev);
                cp.delete(targetUid);
                return cp;
            });
        }
    };

    useEffect(() => {
        if (!user?.uid) return;
        const offIn = onIncomingChallengesSnapshot(setIncomingChallenges);
        const offOut = onOutgoingChallengesSnapshot(setOutgoingChallenges);
        return () => { offIn?.(); offOut?.(); };
    }, [user?.uid]);

    const pendingOutgoingTo = useMemo(
        () => new Set<string>(outgoingChallenges.filter(c => c.status === 'pending').map(c => c.toUid)),
        [outgoingChallenges]
    );

    const pendingIncomingFrom = useMemo(
        () => new Map<string, any>(incomingChallenges.filter(c => c.status === 'pending').map(c => [c.fromUid, c])),
        [incomingChallenges]
    );

    const handleChallenge = async (uid: string) => {
        try {
            const code = await sendChallengeWithRoom(uid, mp.createRoomAndWaitCode);
            pushToast({ kind: "success", msg: `Desafío enviado (sala ${code})` });
            onStartMultiplayer();
        } catch (e: any) {
            pushToast({ kind: "error", msg: e?.message ?? "No se pudo enviar el desafío" });
        }
    }

    const handleAcceptChallenge = async (chId: string) => {
        try {
            await acceptChallengeAndJoin(chId, mp.joinRoom);
            pushToast({ kind: "success", msg: "Te uniste a la sala" });
            onStartMultiplayer();
            onClose?.();
        } catch (e: any) {
            pushToast({ kind: "error", msg: e?.message ?? "Error al aceptar desafío" });
        }
    }

    const handleRejectChallenge = async (chId: string) => {
        try {
            await rejectChallenge(chId);
        } catch (e: any) {
            pushToast({ kind: "error", msg: e?.message ?? "Error al rechazar" });
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-foreground font-bold text-base tracking-wide">Amigos</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Buscar</h3>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                                placeholder="Buscar por nickname…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") doSearch();
                                }}
                            />
                            <button
                                onClick={doSearch}
                                disabled={searchLoading || !q.trim()}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-3 py-2 text-sm hover:bg-muted/70 disabled:opacity-60"
                            >
                                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </button>
                        </div>

                        {q.trim() && (
                            <div className="mt-3 rounded-lg border border-border">
                                {searchLoading ? (
                                    <div className="p-4 text-sm text-muted-foreground">Buscando…</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-sm text-muted-foreground">No se encontraron resultados.</div>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {searchResults.map((u: any) => {
                                            const isFriend = friendSet.has(u.uid);
                                            const isPendingOut = outgoingToSet.has(u.uid);
                                            const isSending = sendingTo.has(u.uid);
                                            const isIncomingFrom = incomingFromSet.has(u.uid);
                                            const incomingReq = incomingByFrom.get(u.uid);
                                            const disabled = isFriend || isPendingOut || isSending || isIncomingFrom;

                                            return (
                                                <li key={u.uid} className="flex items-center gap-3 p-3">
                                                    {u.photoURL ? (
                                                        <img
                                                            src={u.photoURL}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold">{(u.nickname ?? "J").charAt(0).toUpperCase()}</span>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{u.nickname ?? "Jugador"}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Cups: <span className="tabular-nums font-semibold">{u.cups ?? 0}</span>
                                                        </p>
                                                    </div>

                                                    {isFriend ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                onClick={() => { }}
                                                            >
                                                                Desafiar
                                                            </button>
                                                            <button
                                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                onClick={() => onViewHistory?.(u.uid)}
                                                            >
                                                                Ver historial
                                                            </button>
                                                        </div>
                                                    ) : isIncomingFrom && incomingReq ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                onClick={() => respondFriendRequest(incomingReq.id, true)}
                                                            >
                                                                Aceptar
                                                            </button>
                                                            <button
                                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                onClick={() => respondFriendRequest(incomingReq.id, false)}
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-60"
                                                            disabled={disabled}
                                                            onClick={() => handleSend(u.uid)}
                                                        >
                                                            {isPendingOut || isSending ? "Pendiente…" : "Agregar"}
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Solicitudes</h3>
                        {incomingReqs.length === 0 ? (
                            <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                                No tienes solicitudes pendientes.
                            </div>
                        ) : (
                            <ul className="rounded-md border border-border divide-y divide-border">
                                {incomingReqs.map((r: any) => (
                                    <li key={r.id} className="flex items-center justify-between p-3">
                                        <span className="text-sm">
                                            Solicitud de <span className="font-semibold">{r.sender?.nickname ?? r.fromUid}</span>
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                onClick={() => respondFriendRequest(r.id, true)}
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                onClick={() => respondFriendRequest(r.id, false)}
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Tus amigos</h3>
                        <div className="overflow-y">
                            {friendRows.length === 0 ? (
                                <div className="rounded-md border border-border p-6 text-center">
                                    <p className="text-sm text-muted-foreground">No tienes amigos agregados</p>
                                </div>
                            ) : (
                                <ul className="rounded-md border border-border divide-y divide-border">
                                    {friendRows.map((fr) => (
                                        <li key={fr.uid} className="flex items-center gap-3 p-3">
                                            {fr.photoURL ? (
                                                <img
                                                    src={fr.photoURL}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold">{fr.nickname.charAt(0).toUpperCase()}</span>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{fr.nickname}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{fr.presence ?? "offline"}</p>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <span
                                                    title={
                                                        fr.trend === "up" ? "En ascenso" : fr.trend === "down" ? "En descenso" : "Sin cambios"
                                                    }
                                                >
                                                    {TrendIcon(fr.trend)}
                                                </span>
                                                <Trophy className="w-4 h-4" aria-hidden />
                                                <span className="text-sm font-bold tabular-nums">{fr.cups}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {(() => {
                                                    const hasPendingOut = pendingOutgoingTo.has(fr.uid);
                                                    const incoming = pendingIncomingFrom.get(fr.uid);

                                                    if (incoming) {
                                                        return (
                                                            <div className="flex gap-2">
                                                                <button className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                    onClick={() => handleAcceptChallenge(incoming.id)}>
                                                                    Aceptar desafío
                                                                </button>
                                                                <button className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                                    onClick={() => handleRejectChallenge(incoming.id)}>
                                                                    Rechazar
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-60"
                                                            disabled={hasPendingOut}
                                                            onClick={() => handleChallenge(fr.uid)}
                                                        >
                                                            {hasPendingOut ? "Pendiente…" : "Desafiar"}
                                                        </button>
                                                    );
                                                })()}
                                                {/* <button
                                                    className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                                    onClick={() => onViewHistory?.(fr.uid)}
                                                >
                                                    Ver historial
                                                </button> */}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
                {toasts.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 space-y-2 w-[90%] max-w-md">
                        {toasts.map((t) => (
                            <div
                                key={t.id}
                                className={`rounded-md px-3 py-2 text-sm border ${t.kind === "success" ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"
                                    }`}
                            >
                                {t.msg}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}