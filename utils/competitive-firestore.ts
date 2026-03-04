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

export async function updateLeaderboardFromProfile(uid: string, profile: CompetitiveProfile) {
    const deps = getFirebase();
    if (!deps) return;
    const { db, auth } = deps;

    const nickname =
        auth.currentUser?.displayName ?? auth.currentUser?.email?.split("@")[0] ?? "Jugador";

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
        },
        { merge: true }
    );
}
