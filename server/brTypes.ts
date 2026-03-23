export type BRStatus =
    | "lobby"
    | "countdown"
    | "round_active"
    | "round_end"
    | "sudden_death"
    | "finished";

export interface BRPlayerState {
    socketId: string;
    name: string;
    wordsResolved: number;
    currentWordIndex: number;
    currentAttempt: number;
    finishedCurrentWord: boolean;
    solvedCurrentWord: boolean;
    isEliminated: boolean;
    eliminatedAtRound?: number;
    abandoned: boolean;
    finalPosition?: number;
}

export interface BattleRoyaleRoom {
    id: string;
    code: string;
    mode: "battle_royale";
    origin: "queue" | "private";
    status: BRStatus;
    players: BRPlayerState[];
    words: string[];
    currentRound: number;
    roundTimerEndsAt: number | null;
    roundTimer: ReturnType<typeof setTimeout> | null;
    allFinishedCurrent: boolean;
    eliminatedPlayers: string[];
    winner?: string;
    cleanupTimer: ReturnType<typeof setTimeout> | null;
    createdAt: number;
}