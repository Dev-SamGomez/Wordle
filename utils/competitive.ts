import { CompetitiveProfile, CompetitiveResult } from "@/data/competitive-res";

const FLOOR_CUPS = 0;

export function resultToDelta(result: CompetitiveResult): number {
    switch (result) {
        case "win": return +30;
        case "lose": return -25;
        case "draw": return 0;
    }
}

export function applyCompetitiveResult(
    profile: CompetitiveProfile,
    result: CompetitiveResult,
    context?: { roomCode?: string | null; opponentId?: string | null }
): CompetitiveProfile {
    const delta = resultToDelta(result);
    let cups = profile.cups + delta;
    if (cups < FLOOR_CUPS) cups = FLOOR_CUPS;

    const updated: CompetitiveProfile = {
        ...profile,
        cups,
        wins: profile.wins + (result === "win" ? 1 : 0),
        losses: profile.losses + (result === "lose" ? 1 : 0),
        draws: profile.draws + (result === "draw" ? 1 : 0),
        gamesPlayed: profile.gamesPlayed + 1,
        lastUpdated: new Date().toISOString(),
        history: [
            {
                ts: Date.now(),
                result,
                delta,
                roomCode: context?.roomCode ?? null,
                opponentId: context?.opponentId ?? null,
            },
            ...profile.history.slice(0, 49),
        ],
    };

    return updated;
}

export function formatCups(n: number) {
    if (n < 1000) return String(n);
    if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    if (n < 1000000) return Math.round(n / 1000) + "k";
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
}