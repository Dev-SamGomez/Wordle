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
    mode: "1v1" | "battle_royale";
    status: RoomStatus;
    players: PlayerState[];
    words: string[];
    createdAt: number;
    rematchRequests?: Set<string>;
    cleanupTimer: ReturnType<typeof setTimeout> | null;
    pendingDrawBy: string | null;
    drawTimeout: ReturnType<typeof setTimeout> | null;
    drawOffersCountByPlayer: Record<string, number>;
}