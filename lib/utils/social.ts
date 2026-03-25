"use client";

import { getFirebase } from "@/lib/firebase-client";
import {
    addDoc, collection, doc, getDoc, getDocs,
    onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, limit,
    Unsubscribe
} from "firebase/firestore";

export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type IncomingFriendRequest = {
    id: string;
    fromUid: string;
    toUid: string;
    status: FriendRequestStatus;
    createdAt?: any;
    updatedAt?: any;

    sender?: {
        nickname: string;
        cups: number;
        photoURL?: string | null;
    };
};

export type OutgoingFriendRequest = IncomingFriendRequest;

export async function searchUsersByNicknameLowerPrefix(q: string, max = 20) {
    const deps = getFirebase(); if (!deps) return [];
    const { db } = deps;
    const nickLower = (q ?? "").trim().toLowerCase();
    if (!nickLower) return [];

    const qy = query(
        collection(db, "leaderboard"),
        where("nicknameLower", ">=", nickLower),
        where("nicknameLower", "<=", nickLower + "\uf8ff"),
        limit(max)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
}

export async function sendFriendRequest(toUid: string) {
    const deps = getFirebase(); if (!deps) throw new Error("Firebase no disponible");
    const { db, auth } = deps;
    const fromUid = auth.currentUser?.uid; if (!fromUid) throw new Error("No autenticado");
    if (fromUid === toUid) throw new Error("No puedes agregarte a ti mismo");

    const a = fromUid < toUid ? fromUid : toUid;
    const b = fromUid < toUid ? toUid : fromUid;
    const pairId = `${a}_${b}`;
    const fref = doc(db, "friendships", pairId);
    const fsnap = await getDoc(fref);
    if (fsnap.exists()) throw new Error("Ya son amigos");

    const q1 = query(
        collection(db, "friendRequests"),
        where("fromUid", "==", fromUid),
        where("toUid", "==", toUid),
        where("status", "==", "pending")
    );
    if (!(await getDocs(q1)).empty) throw new Error("Solicitud ya enviada");

    const qInv = query(
        collection(db, "friendRequests"),
        where("fromUid", "==", toUid),
        where("toUid", "==", fromUid),
        where("status", "==", "pending")
    );
    if (!(await getDocs(qInv)).empty) throw new Error("Tienes una solicitud entrante de este usuario");

    await addDoc(collection(db, "friendRequests"), {
        fromUid, toUid, status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
}

export async function respondFriendRequest(requestId: string, accept: boolean) {
    const deps = getFirebase(); if (!deps) throw new Error("Firebase no disponible");
    const { db, auth } = deps;
    const uid = auth.currentUser?.uid; if (!uid) throw new Error("No autenticado");

    const ref = doc(db, "friendRequests", requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Solicitud no existe");
    const fr: any = snap.data();
    if (fr.toUid !== uid) throw new Error("No autorizado");

    if (accept) {
        const a = fr.fromUid < fr.toUid ? fr.fromUid : fr.toUid;
        const b = fr.fromUid < fr.toUid ? fr.toUid : fr.fromUid;
        const pairId = `${a}_${b}`;
        await setDoc(doc(db, "friendships", pairId), {
            aUid: a, bUid: b,
            createdAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
        }, { merge: true });
        await updateDoc(ref, { status: "accepted", updatedAt: serverTimestamp() });
    } else {
        await updateDoc(ref, { status: "rejected", updatedAt: serverTimestamp() });
    }
}

export async function cancelFriendRequest(requestId: string) {
    const deps = getFirebase(); if (!deps) throw new Error("Firebase no disponible");
    const { db, auth } = deps;
    const uid = auth.currentUser?.uid; if (!uid) throw new Error("No autenticado");

    const ref = doc(db, "friendRequests", requestId);
    const snap = await getDoc(ref); if (!snap.exists()) return;
    const fr: any = snap.data();
    if (fr.fromUid !== uid) throw new Error("No autorizado");

    await updateDoc(ref, { status: "cancelled", updatedAt: serverTimestamp() });
}

export function onFriendsSnapshot(cb: (friendUids: string[]) => void) {
    const deps = getFirebase(); if (!deps) return () => { };
    const { db, auth } = deps;
    const uid = auth.currentUser?.uid; if (!uid) return () => { };

    const qA = query(collection(db, "friendships"), where("aUid", "==", uid));
    const qB = query(collection(db, "friendships"), where("bUid", "==", uid));

    let setA = new Set<string>();
    let setB = new Set<string>();

    const emit = () => {
        const merged = new Set<string>([...setA, ...setB]);
        cb([...merged]);
    };

    const unsubA = onSnapshot(qA, (snap) => {
        setA = new Set(
            snap.docs.map(d => (d.data() as any)?.bUid).filter(Boolean) as string[]
        );
        emit();
    });

    const unsubB = onSnapshot(qB, (snap) => {
        setB = new Set(
            snap.docs.map(d => (d.data() as any)?.aUid).filter(Boolean) as string[]
        );
        emit();
    });

    return () => {
        unsubA();
        unsubB();
    };
}


export function onIncomingFriendRequestsSnapshot(
    cb: (reqs: IncomingFriendRequest[]) => void,
    opts: {
        statuses?: FriendRequestStatus[];
        enrich?: boolean;
    } = {}
): Unsubscribe {
    const deps = getFirebase(); if (!deps) return () => { };
    const { db, auth } = deps;
    const uid = auth.currentUser?.uid; if (!uid) return () => { };

    const statuses = opts.statuses ?? ["pending"];
    const qy = query(
        collection(db, "friendRequests"),
        where("toUid", "==", uid),
        where("status", "in", statuses),
    );

    let cancelled = false;

    const unsub = onSnapshot(qy, async (snap) => {
        const base: IncomingFriendRequest[] = snap.docs.map((d) => {
            const x: any = d.data();
            return {
                id: d.id,
                fromUid: x.fromUid,
                toUid: x.toUid,
                status: x.status,
                createdAt: x.createdAt,
                updatedAt: x.updatedAt,
            };
        });

        if (opts.enrich === false || base.length === 0) {
            if (!cancelled) cb(base);
            return;
        }

        const { db } = getFirebase()!;
        const enriched = await Promise.all(
            base.map(async (r) => {
                try {
                    const sRef = doc(db, "leaderboard", r.fromUid);
                    const sSnap = await getDoc(sRef);
                    if (sSnap.exists()) {
                        const sd: any = sSnap.data();
                        return {
                            ...r,
                            sender: {
                                nickname: sd.nickname ?? "Jugador",
                                cups: typeof sd.cups === "number" ? sd.cups : 0,
                                photoURL: sd.photoURL ?? null,
                            },
                        } as IncomingFriendRequest;
                    }
                } catch { }
                return r;
            })
        );

        if (!cancelled) cb(enriched);
    });

    return () => {
        cancelled = true;
        unsub();
    };
}

export function onOutgoingFriendRequestsSnapshot(
    cb: (reqs: OutgoingFriendRequest[]) => void,
    opts: { statuses?: FriendRequestStatus[]; enrich?: boolean } = {}
): Unsubscribe {
    const deps = getFirebase(); if (!deps) return () => { };
    const { db, auth } = deps;
    const uid = auth.currentUser?.uid; if (!uid) return () => { };

    const statuses = opts.statuses ?? ["pending"];
    const qy = query(
        collection(db, "friendRequests"),
        where("fromUid", "==", uid),
        where("status", "in", statuses),
    );

    let cancelled = false;
    const unsub = onSnapshot(qy, async (snap) => {
        const base = snap.docs.map((d) => {
            const x: any = d.data();
            return { id: d.id, ...x };
        });

        if (opts.enrich === false || base.length === 0) {
            if (!cancelled) cb(base as any);
            return;
        }

        const enriched = await Promise.all(
            base.map(async (r: any) => {
                try {
                    const sRef = doc(db, "leaderboard", r.toUid);
                    const sSnap = await getDoc(sRef);
                    if (sSnap.exists()) {
                        const sd: any = sSnap.data();
                        return {
                            ...r,
                            receiver: {
                                nickname: sd.nickname ?? "Jugador",
                                cups: typeof sd.cups === "number" ? sd.cups : 0,
                                photoURL: sd.photoURL ?? null,
                            },
                        };
                    }
                } catch { }
                return r;
            })
        );

        if (!cancelled) cb(enriched as any);
    });

    return () => { cancelled = true; unsub(); };
}


