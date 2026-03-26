export interface BRProfile {
    brCups: number;
    brWins: number;
    brGamesPlayed: number;
    brBestPosition: number;
    brHistory: BRHistoryEntry[];
    lastUpdated: string;
}

export interface BRHistoryEntry {
    ts: number;
    roomId: string;
    mode: "battle_royale";
    playedAt: string;
    playerCount: number;
    finalPosition: number;
    wordsResolved: number;
    totalRounds: number;
    eliminatedAtRound: number | null;
    cupsChange: number;
    opponents: string[];
    abandoned: boolean;
    reachedSuddenDeath: boolean;
    wonSuddenDeath: boolean | null;
}

export interface BRResultParams {
    finalPosition: number;
    wordsResolved: number;
    totalRounds: number;
    eliminatedAtRound: number | null;
    playerCount: number;
    opponents: string[];
    roomId: string;
    abandoned: boolean;
    reachedSuddenDeath: boolean;
    wonSuddenDeath: boolean | null;
    cupsChangeSentByServer?: number;
}

const FLOOR_BR_CUPS = 0;

export function positionToBRDelta(
    position: number,
    abandoned: boolean,
    eliminatedAtRound: number | null,
    totalPlayers: number
): number {
    if (abandoned) return -15;
    if (position === totalPlayers) return -15;
    if (eliminatedAtRound === 0) return -15;

    switch (position) {
        case 1: return 50;
        case 2: return 20;
        case 3: return 10;
        default: return 5;
    }
}

export function applyBRResult(profile: BRProfile, params: BRResultParams): BRProfile {
    const delta = typeof params.cupsChangeSentByServer === "number"
        ? params.cupsChangeSentByServer
        : positionToBRDelta(params.finalPosition, params.abandoned, params.eliminatedAtRound, params.playerCount);

    let brCups = (profile.brCups ?? 0) + delta;
    if (brCups < FLOOR_BR_CUPS) brCups = FLOOR_BR_CUPS;

    const entry: BRHistoryEntry = {
        ts: Date.now(),
        roomId: params.roomId,
        mode: "battle_royale",
        playedAt: new Date().toISOString(),
        playerCount: params.playerCount,
        finalPosition: params.finalPosition,
        wordsResolved: params.wordsResolved,
        totalRounds: params.totalRounds,
        eliminatedAtRound: params.eliminatedAtRound,
        cupsChange: delta,
        opponents: params.opponents,
        abandoned: params.abandoned,
        reachedSuddenDeath: params.reachedSuddenDeath,
        wonSuddenDeath: params.wonSuddenDeath,
    };

    return {
        ...profile,
        brCups,
        brWins: (profile.brWins ?? 0) + (params.finalPosition === 1 && !params.abandoned ? 1 : 0),
        brGamesPlayed: (profile.brGamesPlayed ?? 0) + 1,
        brBestPosition: Math.min(profile.brBestPosition ?? 6, params.finalPosition),
        brHistory: [entry, ...(profile.brHistory ?? []).slice(0, 49)],
        lastUpdated: new Date().toISOString(),
    };
}

export function normalizeBRProfile(input: Partial<BRProfile> | null | undefined): BRProfile {
    return {
        brCups: typeof input?.brCups === "number" ? input.brCups : 0,
        brWins: typeof input?.brWins === "number" ? input.brWins : 0,
        brGamesPlayed: typeof input?.brGamesPlayed === "number" ? input.brGamesPlayed : 0,
        brBestPosition: typeof input?.brBestPosition === "number" ? input.brBestPosition : 6,
        brHistory: Array.isArray(input?.brHistory) ? input!.brHistory : [],
        lastUpdated: typeof input?.lastUpdated === "string" ? input.lastUpdated : new Date().toISOString(),
    };
}

export function computeBRForm(history: BRHistoryEntry[], windowSize = 5): string {
    return [...history]
        .sort((a, b) => b.ts - a.ts)
        .slice(0, windowSize)
        .map(h => h.finalPosition === 1 ? "W" : h.finalPosition <= 3 ? "T" : "L")
        .join("");
}