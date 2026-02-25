export type RoomStatus = "waiting" | "countdown" | "playing" | "finished";

export interface PlayerState {
    socketId: string;
    name: string;
    score: number;
    currentWordIndex: number;
    attempts: number;
    finished: boolean;
    finishedAt?: number;
}

export interface Room {
    id: string;
    code: string;
    status: RoomStatus;
    players: PlayerState[];
    words: string[];
    createdAt: number;
    rematchRequests?: Set<string>;
    cleanupTimer?: NodeJS.Timeout | null;
}