import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { getThreeRandomWords } from "./wordService";
import { generateRoomCode } from "./matchmaking";
import { roomsByCode, createRoom } from "./rooms";
import { BattleRoyaleRoom, BRPlayerState } from "./brTypes";
import { startBRRound } from "./brGameEngine";

export type BRQueueEntry = {
    socketId: string;
    name: string;
    enqueuedAt: number;
    isHost: boolean;
};

export const brQueue: BRQueueEntry[] = [];
let brCountdownTimer: ReturnType<typeof setTimeout> | null = null;
let brCountdownInterval: ReturnType<typeof setInterval> | null = null;
let brCountdownSeconds = 0;

export function addToBRQueue(io: Server, socketId: string, name: string) {
    const isHost = brQueue.length === 0;
    brQueue.push({ socketId, name, enqueuedAt: Date.now(), isHost });

    const socket = io.sockets.sockets.get(socketId);
    socket?.join("br_lobby");

    emitBRLobbyUpdate(io);

    if (brQueue.length >= 4 && !brCountdownTimer) {
        startBRCountdown(io);
    }

    if (brQueue.length >= 6) {
        launchBRMatch(io);
    }
}

export function removeFromBRQueue(io: Server, socketId: string) {
    const idx = brQueue.findIndex(e => e.socketId === socketId);
    if (idx === -1) return;

    const wasHost = brQueue[idx].isHost;
    brQueue.splice(idx, 1);

    if (wasHost && brQueue.length > 0) {
        brQueue[0].isHost = true;
    }

    const socket = io.sockets.sockets.get(socketId);
    socket?.leave("br_lobby");

    if (brQueue.length < 4) {
        cancelBRCountdown();
    }

    emitBRLobbyUpdate(io);
}

export function hostForceLaunch(io: Server, socketId: string) {
    const entry = brQueue.find(e => e.socketId === socketId);
    if (!entry?.isHost) return;
    if (brQueue.length < 4) return;
    launchBRMatch(io);
}

function startBRCountdown(io: Server) {
    brCountdownSeconds = 30;

    brCountdownInterval = setInterval(() => {
        brCountdownSeconds--;
        emitBRLobbyUpdate(io);

        if (brCountdownSeconds <= 0) {
            launchBRMatch(io);
        }
    }, 1000);
}

function cancelBRCountdown() {
    if (brCountdownInterval) {
        clearInterval(brCountdownInterval);
        brCountdownInterval = null;
    }
    if (brCountdownTimer) {
        clearTimeout(brCountdownTimer);
        brCountdownTimer = null;
    }
    brCountdownSeconds = 0;
}

function emitBRLobbyUpdate(io: Server) {
    io.to("br_lobby").emit("br_lobby_update", {
        players: brQueue.map(e => ({
            socketId: e.socketId,
            name: e.name,
            isHost: e.isHost,
        })),
        countdownSeconds: brCountdownSeconds,
        canStart: brQueue.length >= 4,
    });
}

export function launchBRMatch(io: Server) {
    if (brQueue.length < 4) return;

    cancelBRCountdown();

    const participants = brQueue.splice(0, 6);

    for (const p of participants) {
        const socket = io.sockets.sockets.get(p.socketId);
        socket?.leave("br_lobby");
    }

    const id = uuid();
    const code = generateRoomCode(new Set(roomsByCode.keys()));
    const words = Array.from({ length: participants.length }, () => getThreeRandomWords()[0]);

    const players: BRPlayerState[] = participants.map(p => ({
        socketId: p.socketId,
        name: p.name,
        wordsResolved: 0,
        currentWordIndex: 0,
        currentAttempt: 0,
        finishedCurrentWord: false,
        solvedCurrentWord: false,
        isEliminated: false,
        abandoned: false,
    }));

    const room: BattleRoyaleRoom = {
        id,
        code,
        mode: "battle_royale",
        origin: "queue",
        status: "countdown",
        players,
        words,
        currentRound: 0,
        roundTimerEndsAt: null,
        roundTimer: null,
        allFinishedCurrent: false,
        eliminatedPlayers: [],
        winner: undefined,
        cleanupTimer: null,
        createdAt: Date.now(),
    };

    createRoom(room as any);

    for (const p of participants) {
        const socket = io.sockets.sockets.get(p.socketId);
        socket?.join(id);
        socket?.emit("br_match_found", { code });
    }

    let counter = 3;
    const interval = setInterval(() => {
        io.to(id).emit("countdown_tick", counter);
        counter--;
        if (counter < 0) {
            clearInterval(interval);
            startBRRound(io, room);
        }
    }, 1000);
}