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

export type CompetitiveMode = null | "1v1" | "battle_royale";