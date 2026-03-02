export type GameFinishedPayload = {
    winnerSocketId: string | "draw";
    winnerName: string;
    reason?: "three_of_three" | "score" | "draw" | "abandon";
    scores?: { socketId: string; name: string; score: number }[];
};