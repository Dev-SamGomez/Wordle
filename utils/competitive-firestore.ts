"use client";

import { getFirebase } from "@/lib/firebase-client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { CompetitiveProfile } from "@/data/competitive-res";

export async function getCompetitiveProfile(uid: string): Promise<CompetitiveProfile> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");

    const { db } = deps;
    const ref = doc(db, "profiles", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return {
            cups: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            lastUpdated: new Date().toISOString(),
            history: []
        };
    }

    const data = snap.data();
    return {
        cups: data.cups,
        wins: data.wins,
        losses: data.losses,
        draws: data.draws,
        gamesPlayed: data.gamesPlayed,
        lastUpdated: data.lastUpdated?.toDate().toISOString() ?? new Date().toISOString(),
        history: data.history ?? [],
    };
}

export async function saveCompetitiveProfileToFirestore(uid: string, p: CompetitiveProfile) {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;

    await setDoc(
        doc(db, "profiles", uid),
        {
            ...p,
            lastUpdated: serverTimestamp(),
        },
        { merge: true }
    );
}

function computeTrendFromHistory(
    history: { delta: number; ts: number; result: "win" | "lose" | "draw" }[],
    windowSize = 5
) {
    const sorted = [...(history ?? [])].sort((a, b) => b.ts - a.ts);
    const recent = sorted.slice(0, windowSize);
    const recentDelta = recent.reduce((acc, h) => acc + (typeof h.delta === "number" ? h.delta : 0), 0);

    let trend: "up" | "down" | "flat" = "flat";
    if (recentDelta > 0) trend = "up";
    else if (recentDelta < 0) trend = "down";

    const lastResult = recent[0]?.result ?? null;
    const lastTs = recent[0]?.ts ?? null;

    const form = recent.map(h => (h.result === "win" ? "W" : h.result === "lose" ? "L" : "D")).join("");

    return { trend, recentDelta, lastResult, lastTs, form };
}

export async function updateLeaderboardFromProfile(uid: string, profile: CompetitiveProfile) {
    const deps = getFirebase();
    if (!deps) return;
    const { db, auth } = deps;

    const nickname =
        auth.currentUser?.displayName ?? auth.currentUser?.email?.split("@")[0] ?? "Jugador";

    const { trend, recentDelta, lastResult, lastTs, form } = computeTrendFromHistory(profile.history ?? [], 5);

    await setDoc(
        doc(db, "leaderboard", uid),
        {
            nickname,
            cups: profile.cups,
            wins: profile.wins,
            losses: profile.losses,
            draws: profile.draws,
            gamesPlayed: profile.gamesPlayed,
            updatedAt: serverTimestamp(),
            photoURL: auth.currentUser?.photoURL ?? null,
            trend,
            recentDelta,
            lastResult,
            lastTs,
            form,
        },
        { merge: true }
    );
}
