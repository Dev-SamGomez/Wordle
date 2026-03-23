"use client";

import { getFirebase } from "@/lib/firebase-client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { BRProfile, BRHistoryEntry, normalizeBRProfile, computeBRForm } from "./br-competitive";

export async function getBRProfile(uid: string): Promise<BRProfile> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;

    const ref = doc(db, "profiles", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return normalizeBRProfile(null);

    const data = snap.data();
    return normalizeBRProfile(data?.br ?? null);
}

export async function saveBRProfile(uid: string, profile: BRProfile): Promise<void> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;

    const safe = normalizeBRProfile(profile);

    await setDoc(
        doc(db, "profiles", uid),
        {
            br: {
                ...safe,
                lastUpdated: serverTimestamp(),
            },
        },
        { merge: true }
    );
}

export async function updateLeaderboardFromBRProfile(uid: string, profile: BRProfile): Promise<void> {
    const deps = getFirebase();
    if (!deps) return;
    const { db, auth } = deps;

    const nickname =
        auth.currentUser?.displayName ??
        auth.currentUser?.email?.split("@")[0] ??
        "Jugador";

    const safe = normalizeBRProfile(profile);
    const form = computeBRForm(safe.brHistory, 5);
    const sorted = [...safe.brHistory].sort((a, b) => b.ts - a.ts);
    const recentDelta = sorted.slice(0, 5).reduce((acc, h) => acc + h.cupsChange, 0);
    const lastResult = sorted[0]?.finalPosition ?? null;
    const lastTs = sorted[0]?.ts ?? null;

    let trend: "up" | "down" | "flat" = "flat";
    if (recentDelta > 0) trend = "up";
    else if (recentDelta < 0) trend = "down";

    await setDoc(
        doc(db, "leaderboard_br", uid),
        {
            nickname,
            brCups: safe.brCups,
            brWins: safe.brWins,
            brGamesPlayed: safe.brGamesPlayed,
            brBestPosition: safe.brBestPosition,
            photoURL: auth.currentUser?.photoURL ?? null,
            trend,
            form,
            recentDelta,
            lastResult,
            lastTs,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}