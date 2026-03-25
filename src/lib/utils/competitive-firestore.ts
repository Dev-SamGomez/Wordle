"use client";

import { getFirebase } from "@/src/lib/firebase-client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { CompetitiveProfile } from "@/src/data/competitive-res";
import { num } from "./normalize-numbers";


export function normalizeCompetitiveProfile(input: Partial<CompetitiveProfile> | null | undefined): CompetitiveProfile {
    return {
        cups: num(input?.cups),
        wins: num(input?.wins),
        losses: num(input?.losses),
        draws: num(input?.draws),
        gamesPlayed: num(input?.gamesPlayed),
        lastUpdated:
            typeof (input as any)?.lastUpdated === "string"
                ? (input as any).lastUpdated
                : new Date().toISOString(),
        history: Array.isArray(input?.history) ? input!.history : [],
    };
}

export async function getCompetitiveProfile(uid: string): Promise<CompetitiveProfile> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");

    const { db } = deps;
    const ref = doc(db, "profiles", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return normalizeCompetitiveProfile({
            cups: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            lastUpdated: new Date().toISOString(),
            history: [],
        });
    }

    const data = snap.data();
    return normalizeCompetitiveProfile({
        cups: (data as any).cups,
        wins: (data as any).wins,
        losses: (data as any).losses,
        draws: (data as any).draws,
        gamesPlayed: (data as any).gamesPlayed,
        lastUpdated: data.lastUpdated?.toDate?.().toISOString?.() ?? new Date().toISOString(),
        history: (data as any).history ?? [],
    });
}

export async function saveCompetitiveProfileToFirestore(uid: string, p: CompetitiveProfile) {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { db } = deps;

    const safe = normalizeCompetitiveProfile(p);

    await setDoc(
        doc(db, "profiles", uid),
        {
            ...safe,
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

    const safeProfile = normalizeCompetitiveProfile(profile);
    const { trend, recentDelta, lastResult, lastTs, form } = computeTrendFromHistory(
        safeProfile.history ?? [],
        5
    );

    await setDoc(
        doc(db, "leaderboard", uid),
        {
            nickname,
            cups: safeProfile.cups,
            wins: safeProfile.wins,
            losses: safeProfile.losses,
            draws: safeProfile.draws,
            gamesPlayed: safeProfile.gamesPlayed,
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
