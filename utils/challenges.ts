import { getFirebase } from "@/lib/firebase-client";
import {
    addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, query,
    serverTimestamp, Timestamp, updateDoc, where
} from "firebase/firestore";
import { getAuth, Unsubscribe } from "firebase/auth";

const CHALLENGE_COLL = "challenges";
const CHALLENGE_TTL_MIN = 5;

type ChallengeStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export function onIncomingChallengesSnapshot(
    cb: (docs: any[]) => void,
    opts?: { onlyPending?: boolean }
): Unsubscribe | undefined {
    const deps = getFirebase(); if (!deps) return;
    const { db } = deps;
    const uid = getAuth().currentUser?.uid;
    if (!db || !uid) return undefined;

    const qy = query(
        collection(db, "challenges"),
        where("toUid", "==", uid),
        ...(opts?.onlyPending ? [where("status", "==", "pending")] : [])
    );

    const off = onSnapshot(qy, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb(rows);
    });

    return off;
}

export function onOutgoingChallengesSnapshot(
    cb: (docs: any[]) => void
): Unsubscribe | undefined {
    const deps = getFirebase(); if (!deps) return;
    const { db } = deps;
    const uid = getAuth().currentUser?.uid;
    if (!db || !uid) return undefined;

    const qy = query(collection(db, "challenges"), where("fromUid", "==", uid));
    return onSnapshot(qy, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb(rows);
    });
}

export async function sendChallengeWithRoom(
    toUid: string,
    createRoomAndWaitCode: (name?: string) => Promise<string>,
    gameMode?: string
) {
    const deps = getFirebase(); if (!deps) return [];
    const { db } = deps;
    const uid = getAuth().currentUser?.uid;
    if (!db || !uid) throw new Error("No autenticado");
    if (uid === toUid) throw new Error("No puedes desafiarte a ti mismo");

    const q1 = query(
        collection(db, CHALLENGE_COLL),
        where("fromUid", "==", uid),
        where("toUid", "==", toUid),
        where("status", "==", "pending"),
        limit(1)
    );
    const q2 = query(
        collection(db, CHALLENGE_COLL),
        where("fromUid", "==", toUid),
        where("toUid", "==", uid),
        where("status", "==", "pending"),
        limit(1)
    );
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    if (!s1.empty || !s2.empty) {
        throw new Error("Ya existe un desafío pendiente entre ustedes");
    }

    const roomCode = await createRoomAndWaitCode();

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + CHALLENGE_TTL_MIN * 60 * 1000);

    await addDoc(collection(db, CHALLENGE_COLL), {
        fromUid: uid,
        toUid,
        status: "pending" as ChallengeStatus,
        roomCode,
        gameMode: gameMode ?? null,
        createdAt: serverTimestamp(),
        expiresAt,
    });

    return roomCode;
}

export async function acceptChallengeAndJoin(challengeId: string, joinRoom: (code: string, name?: string) => void) {
    const deps = getFirebase(); if (!deps) return [];
    const { db } = deps;
    const uid = getAuth().currentUser?.uid;
    if (!db || !uid) throw new Error("No autenticado");

    const ref = doc(db, CHALLENGE_COLL, challengeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Challenge no existe");
    const ch = snap.data() as any;

    if (ch.status !== "pending") throw new Error("Challenge no está pendiente");
    if (ch.toUid !== uid) throw new Error("No eres el destinatario de este challenge");
    if (!ch.roomCode) throw new Error("Challenge sin roomCode");

    joinRoom(ch.roomCode);
    await updateDoc(ref, { status: "accepted" as ChallengeStatus });
}

export async function rejectChallenge(challengeId: string) {
    const deps = getFirebase(); if (!deps) return [];
    const { db } = deps;
    const uid = getAuth().currentUser?.uid;
    if (!db || !uid) throw new Error("No autenticado");

    const ref = doc(db, CHALLENGE_COLL, challengeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const ch = snap.data() as any;

    if (ch.toUid !== uid && ch.fromUid !== uid) throw new Error("No autorizado");
    if (ch.status !== "pending") return;

    await updateDoc(ref, { status: "rejected" as ChallengeStatus });
}