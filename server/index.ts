import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { getThreeRandomWords } from "./wordService";
import { createRoom, deleteRoom, getRoomByCode, roomsByCode, roomsById } from "./rooms";
import { PlayerState, Room } from "./gameEngine";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(",")
    : [];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
});

function generateRoomCode(existingCodes: Set<string>): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    do {
        code = Array.from({ length: 6 })
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join("");
    } while (existingCodes.has(code));

    return code;
}

function scheduleCleanup(room: Room, ms = 60_000) {
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    room.cleanupTimer = setTimeout(() => {
        deleteRoom(room.id);
    }, ms);
}

function maybeFinishRoom(io: Server, room: Room): boolean {
    if (room.status === "finished") return true;

    const [p1, p2] = room.players;
    const s1 = p1.score ?? 0;
    const s2 = p2.score ?? 0;
    const bothFinished = !!(p1.finished && p2.finished);

    if (s1 === 3 && s2 < 3) {
        room.status = "finished";
        io.to(room.id).emit("game_finished", { winnerSocketId: p1.socketId, winnerName: p1.name });
        scheduleCleanup(room);
        return true;
    }
    if (s2 === 3 && s1 < 3) {
        room.status = "finished";
        io.to(room.id).emit("game_finished", { winnerSocketId: p2.socketId, winnerName: p2.name });
        scheduleCleanup(room);
        return true;
    }

    if (s1 === 3 && s2 === 3) {
        const t1 = p1.finishedAt ?? Number.MAX_SAFE_INTEGER;
        const t2 = p2.finishedAt ?? Number.MAX_SAFE_INTEGER;

        room.status = "finished";
        if (t1 === t2) {
            io.to(room.id).emit("game_finished", { winnerSocketId: "draw", winnerName: "Empate" });
        } else {
            const winner = t1 < t2 ? p1 : p2;
            io.to(room.id).emit("game_finished", { winnerSocketId: winner.socketId, winnerName: winner.name });
        }
        scheduleCleanup(room);
        return true;
    }

    if (bothFinished) {
        room.status = "finished";
        if (s1 > s2) {
            io.to(room.id).emit("game_finished", { winnerSocketId: p1.socketId, winnerName: p1.name });
        } else if (s2 > s1) {
            io.to(room.id).emit("game_finished", { winnerSocketId: p2.socketId, winnerName: p2.name });
        } else {
            io.to(room.id).emit("game_finished", { winnerSocketId: "draw", winnerName: "Empate" });
        }
        scheduleCleanup(room);
        return true;
    }

    return false;
}

function resetPlayersForRematch(room: Room) {
    room.players.forEach(p => {
        p.score = 0;
        p.currentWordIndex = 0;
        p.finished = false;
        p.finishedAt = undefined;
    });
}

function startRematch(io: Server, room: Room) {
    if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
        room.cleanupTimer = null;
    }

    room.words = getThreeRandomWords();
    resetPlayersForRematch(room);
    room.status = "countdown";
    room.rematchRequests?.clear();

    io.to(room.id).emit("room_ready");

    let counter = 3;
    const interval = setInterval(() => {
        io.to(room.id).emit("countdown_tick", counter);
        counter--;
        if (counter < 0) {
            clearInterval(interval);
            room.status = "playing";
            io.to(room.id).emit("game_start", { words: room.words });
        }
    }, 1000);
}

io.on("connection", (socket: Socket) => {
    console.log("Connected:", socket.id);

    socket.on("create_room", (data: { name: string }) => {
        const id = uuid();
        const code = generateRoomCode(new Set(roomsByCode.keys()));

        const host: PlayerState = {
            socketId: socket.id,
            name: data.name,
            score: 0,
            currentWordIndex: 0,
            attempts: 0,
            finished: false,
            finishedAt: undefined
        };

        const room: Room = {
            id,
            code,
            status: "waiting",
            players: [host],
            words: getThreeRandomWords(),
            createdAt: Date.now(),
        };
        console.log("palabras competitivas ", room.code)
        console.log("palabras codigo de sala ", room.words)
        createRoom(room);
        socket.join(id);

        socket.emit("room_created", { code });
    });

    socket.on("join_room", (data: { code: string; name: string }) => {
        const room = getRoomByCode(data.code);

        if (!room || room.players.length >= 2) {
            socket.emit("join_error", { message: "Sala inválida o llena" });
            return;
        }

        const player: PlayerState = {
            socketId: socket.id,
            name: data.name,
            score: 0,
            currentWordIndex: 0,
            attempts: 0,
            finished: false,
        };

        room.players.push(player);
        socket.join(room.id);

        room.status = "countdown";

        io.to(room.id).emit("room_ready");

        let counter = 3;

        const interval = setInterval(() => {
            io.to(room.id).emit("countdown_tick", counter);
            counter--;

            if (counter < 0) {
                clearInterval(interval);
                room.status = "playing";
                io.to(room.id).emit("game_start", { words: room.words });
            }
        }, 1000);
    });

    socket.on("row_resolved", (data: {
        code: string;
        wordIndex: number;
        wasSolved: boolean;
        wordFinished?: boolean;
        lastEval: ("correct" | "present" | "absent")[];
    }) => {
        const room = getRoomByCode(data.code);
        if (!room || room.status !== "playing") return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        const current = player.currentWordIndex ?? 0;

        console.log("[SERVER] row_resolved recv", socket.id, data);
        console.log("[SERVER] player progress before", player.currentWordIndex);

        if (data.wordIndex !== current) {
            console.warn("Ignoring out-of-order/duplicate row_resolved", data, "expected", current);
            return;
        }

        if (data.wordFinished) {
            if (data.wasSolved) {
                player.score = Math.min(3, (player.score ?? 0) + 1);
            }
            player.currentWordIndex = Math.min(3, current + 1);

            if (player.currentWordIndex >= 3 && !player.finished) {
                player.finished = true;
                player.finishedAt = Date.now();
            }
        }

        socket.to(room.id).emit("rival_progress", {
            solvedCount: player.score ?? player.currentWordIndex ?? 0,
            currentWordIndex: player.currentWordIndex ?? 0,
            evaluation: data.lastEval,
            wordFinished: !!data.wordFinished,
            wasSolved: data.wasSolved,
            wordIndex: data.wordIndex,
        });

        if (maybeFinishRoom(io, room)) return;
    });

    socket.on("disconnect", () => {
        for (const [id, room] of roomsById.entries()) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (!player) continue;

            const remaining = room.players.find(
                p => p.socketId !== socket.id
            );

            if (remaining) {
                io.to(id).emit("game_finished", {
                    winner: remaining.socketId,
                    reason: "abandon",
                });
            }

            deleteRoom(id);
            break;
        }
    });

    socket.on("request_rematch", ({ code }: { code: string }) => {
        const room = getRoomByCode(code);
        if (!room || room.status !== "finished") return;

        if (!room.rematchRequests) room.rematchRequests = new Set();
        room.rematchRequests.add(socket.id);

        io.to(room.id).emit("rematch_update", {
            requested: Array.from(room.rematchRequests),
        });

        if (room.rematchRequests.size >= 2) {
            startRematch(io, room);
        }
    });

    socket.on("decline_rematch", ({ code }: { code: string }) => {
        const room = getRoomByCode(code);
        if (!room) return;

        io.to(room.id).emit("rematch_declined", { by: socket.id });
        deleteRoom(room.id);
    });
});

const PORT = Number(process.env.PORT) || 3001
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Socket.io server running on port ${PORT}`)
})