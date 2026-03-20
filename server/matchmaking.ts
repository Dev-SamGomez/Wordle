export type QueueEntry = {
    socketId: string;
    name: string;
    enqueuedAt: number;
};

export const matchmakingQueue: QueueEntry[] = [];

export const removeFromQueue = (socketId: string) => {
    const idx = matchmakingQueue.findIndex(e => e.socketId === socketId);
    if (idx !== -1) matchmakingQueue.splice(idx, 1);
}

export const takeOpponentFIFO = (excludeId: string): QueueEntry | null => {
    for (let i = 0; i < matchmakingQueue.length; i++) {
        if (matchmakingQueue[i].socketId !== excludeId) {
            const [opponent] = matchmakingQueue.splice(i, 1);
            return opponent;
        }
    }
    return null;
}

export const generateRoomCode = (existingCodes: Set<string>): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    do {
        code = Array.from({ length: 6 })
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join("");
    } while (existingCodes.has(code));

    return code;
}