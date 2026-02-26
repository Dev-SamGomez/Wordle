export type CompetitiveResult = "win" | "lose" | "draw";

export type CompetitiveHistoryItem = {
    ts: number;
    result: CompetitiveResult;
    delta: number;
    roomCode?: string | null;
    opponentId?: string | null;
};

export type CompetitiveProfile = {
    cups: number;
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
    lastUpdated: string;
    history: CompetitiveHistoryItem[];
};

const STORAGE_KEY = "wordle-competitive-profile-v1";
const DEFAULT_STARTING_CUPS = 0;
const FLOOR_CUPS = 0;

export function loadCompetitiveProfile(): CompetitiveProfile {
    if (typeof window === "undefined") {
        return {
            cups: DEFAULT_STARTING_CUPS,
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            lastUpdated: new Date().toISOString(),
            history: [],
        };
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                cups: DEFAULT_STARTING_CUPS,
                wins: 0,
                losses: 0,
                draws: 0,
                gamesPlayed: 0,
                lastUpdated: new Date().toISOString(),
                history: [],
            };
        }
        const parsed = JSON.parse(raw) as Partial<CompetitiveProfile>;
        return {
            cups: typeof parsed.cups === "number" ? parsed.cups : DEFAULT_STARTING_CUPS,
            wins: parsed.wins ?? 0,
            losses: parsed.losses ?? 0,
            draws: parsed.draws ?? 0,
            gamesPlayed: parsed.gamesPlayed ?? 0,
            lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
            history: Array.isArray(parsed.history) ? parsed.history : [],
        };
    } catch {
        return {
            cups: DEFAULT_STARTING_CUPS,
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            lastUpdated: new Date().toISOString(),
            history: [],
        };
    }
}

export function saveCompetitiveProfile(p: CompetitiveProfile) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

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

export function formatCups (n: number) {
    if (n >= 1000) {
        const v = n / 1000;
        return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
    }
    return String(n);
}