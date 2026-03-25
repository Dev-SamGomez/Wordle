"use client";

import { getFirebase } from "@/lib/firebase-client";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export function normalizeNickname(input: string): {
    ok: boolean;
    nick: string;
    lower: string;
    reason?: string;
} {
    const raw = (input ?? "").trim();
    const cleaned = raw
        .replace(/\s+/g, " ")
        .replace(/[^a-zA-Z0-9_\-.\s]/g, "")
        .trim();

    if (cleaned.length < 3) {
        return { ok: false, nick: cleaned, lower: cleaned.toLowerCase(), reason: "Mínimo 3 caracteres." };
    }
    if (cleaned.length > 20) {
        return { ok: false, nick: cleaned, lower: cleaned.toLowerCase(), reason: "Máximo 20 caracteres." };
    }
    if (/^[\.\-]/.test(cleaned)) {
        return { ok: false, nick: cleaned, lower: cleaned.toLowerCase(), reason: "No debe comenzar con . o -" };
    }

    return { ok: true, nick: cleaned, lower: cleaned.toLowerCase() };
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db, auth } = deps;

    const n = normalizeNickname(nickname);
    if (!n.ok) return false;

    const ref = doc(db, "nicknames", n.lower);
    const snap = await getDoc(ref);
    if (!snap.exists()) return true;

    const owner = (snap.data() as any)?.uid;
    return owner === auth.currentUser?.uid; 
}

export async function updateNicknameTransactional(newNick: string): Promise<void> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db, auth } = deps;

    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const n = normalizeNickname(newNick);
    if (!n.ok) throw new Error(n.reason || "Nickname inválido");

    await runTransaction(db, async (tx) => {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await tx.get(profileRef);

        const currentProfile = profileSnap.exists() ? (profileSnap.data() as any) : null;
        const oldLower: string | null =
            currentProfile?.nicknameLower ??
            (user.displayName ? user.displayName.toLowerCase() : null);

        const newNickRef = doc(db, "nicknames", n.lower);
        const newNickSnap = await tx.get(newNickRef);

        if (newNickSnap.exists()) {
            const owner = (newNickSnap.data() as any)?.uid;
            if (owner !== user.uid) {
                throw new Error("Ese nickname ya está en uso.");
            }
        }

        if (oldLower && oldLower !== n.lower) {
            const oldRef = doc(db, "nicknames", oldLower);
            const oldSnap = await tx.get(oldRef);
            if (oldSnap.exists()) {
                const owner = (oldSnap.data() as any)?.uid;
                if (owner === user.uid) tx.delete(oldRef);
            }
        }

        tx.set(newNickRef, {
            uid: user.uid,
            nickname: n.nick,
            nicknameLower: n.lower,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        }, { merge: true });

        tx.set(profileRef, {
            nickname: n.nick,
            nicknameLower: n.lower,
            lastUpdated: serverTimestamp(),
        }, { merge: true });

        const lbRef = doc(db, "leaderboard", user.uid);
        tx.set(lbRef, {
            nickname: n.nick,
            nicknameLower: n.lower,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    });

    await updateProfile(auth.currentUser!, { displayName: n.nick });
}