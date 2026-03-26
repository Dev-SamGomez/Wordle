import { Server } from "socket.io";
import { BattleRoyaleRoom, BRPlayerState } from "./brTypes";
import { deleteRoom } from "./rooms";
import { getThreeRandomWords } from "./wordService";

const ROUND_TIMERS = [120, 120, 120, 120, 120];

function getRoundDuration(roundIndex: number): number {
    return (ROUND_TIMERS[roundIndex] ?? 60) * 1000;
}

export function startBRRound(io: Server, room: BattleRoyaleRoom) {
    room.status = "round_active";
    room.allFinishedCurrent = false;

    for (const p of room.players.filter(p => !p.isEliminated)) {
        p.currentAttempt = 0;
        p.finishedCurrentWord = false;
        p.solvedCurrentWord = false;
    }

    const duration = getRoundDuration(room.currentRound);
    room.roundTimerEndsAt = Date.now() + duration;

    io.to(room.id).emit("br_round_start", {
        round: room.currentRound,
        word: room.words[room.currentRound],
        roundTimerEndsAt: room.roundTimerEndsAt,
        serverNow: Date.now(),
        players: room.players.map(p => ({
            socketId: p.socketId,
            name: p.name,
            wordsResolved: p.wordsResolved,
            currentAttempt: 0,
            finishedCurrentWord: false,
            solvedCurrentWord: false,
            isEliminated: p.isEliminated,
            abandoned: p.abandoned,
        })),
    });

    room.roundTimer = setTimeout(() => {
        closeRound(io, room);
    }, duration);
}

export function handleBRRowResolved(
    io: Server,
    room: BattleRoyaleRoom,
    socketId: string,
    data: {
        wordIndex: number;
        wasSolved: boolean;
        wordFinished: boolean;
        lastEval: ("correct" | "present" | "absent")[];
    }
) {
    const player = room.players.find(p => p.socketId === socketId);
    if (!player || player.isEliminated || room.status !== "round_active") return;
    if (data.wordIndex !== room.currentRound) return;

    if (player.finishedCurrentWord) return;

    player.currentAttempt++;

    if (data.wordFinished) {
        player.finishedCurrentWord = true;
        player.solvedCurrentWord = data.wasSolved;
        if (data.wasSolved) {
            player.wordsResolved++;
            player.currentWordIndex++;
        }
    }

    io.to(room.id).emit("br_player_progress", {
        socketId,
        name: player.name,
        wordsResolved: player.wordsResolved,
        currentAttempt: player.currentAttempt,
        finishedCurrentWord: player.finishedCurrentWord,
        solvedCurrentWord: player.solvedCurrentWord,
        wasSolved: data.wasSolved,
        evaluation: data.lastEval,
    });

    const socket = io.sockets.sockets.get(socketId);
    socket?.emit("br_row_ack", {
        accepted: true,
        currentAttempt: player.currentAttempt,
        currentWordIndex: player.currentWordIndex,
    });

    if (!data.wordFinished) return;

    const activePlayers = room.players.filter(p => !p.isEliminated);
    const allDone = activePlayers.every(p => p.finishedCurrentWord);
    if (allDone && room.status === "round_active") {
        if (room.roundTimer) {
            clearTimeout(room.roundTimer);
            room.roundTimer = null;
        }
        closeRound(io, room);
    }
}

function closeRound(io: Server, room: BattleRoyaleRoom) {
    if (room.status !== "round_active") return;
    room.status = "round_end";

    if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
    }

    const activePlayers = room.players.filter(p => !p.isEliminated);
    const solved = activePlayers.filter(p => p.solvedCurrentWord);
    const failed = activePlayers.filter(p => !p.solvedCurrentWord);

    let toEliminate: BRPlayerState[] = [];

    if (solved.length === 0) {
        toEliminate = [];
    } else {
        toEliminate = failed;
    }

    for (const p of toEliminate) {
        p.isEliminated = true;
        p.eliminatedAtRound = room.currentRound;
        if (!room.eliminatedPlayers.includes(p.socketId)) {
            room.eliminatedPlayers.push(p.socketId);
        }
    }

    const survivors = activePlayers.filter(p => !p.isEliminated);

    io.to(room.id).emit("br_round_end", {
        round: room.currentRound,
        eliminated: toEliminate.map(p => ({ socketId: p.socketId, name: p.name })),
        survivors: survivors.map(p => ({ socketId: p.socketId, name: p.name })),
        scores: room.players.map(p => ({
            socketId: p.socketId,
            name: p.name,
            wordsResolved: p.wordsResolved,
            isEliminated: p.isEliminated,
        })),
    });

    setTimeout(() => advanceRound(io, room), 4000);
}

function advanceRound(io: Server, room: BattleRoyaleRoom) {
    const survivors = room.players.filter(p => !p.isEliminated);

    if (survivors.length <= 1) {
        endBRMatch(io, room, survivors[0] ?? null);
        return;
    }

    if (survivors.length >= 2) {
        const lastRoundEliminated = room.players.filter(
            p => p.isEliminated && p.eliminatedAtRound === room.currentRound
        );
        if (lastRoundEliminated.length === 0) {
            startSuddenDeath(io, room);
            return;
        }
    }

    room.currentRound++;
    startBRRound(io, room);
}

function startSuddenDeath(io: Server, room: BattleRoyaleRoom) {
    room.status = "sudden_death";

    let newWord: string;
    let attempts = 0;
    do {
        const candidates = getThreeRandomWords();
        newWord = candidates.find(w => !room.words.includes(w)) ?? candidates[0];
        attempts++;
    } while (room.words.includes(newWord) && attempts < 10);

    room.words.push(newWord);
    room.currentRound = room.words.length - 1;

    const duration = 60_000;
    room.roundTimerEndsAt = Date.now() + duration;

    const survivors = room.players.filter(p => !p.isEliminated);
    for (const p of survivors) {
        p.currentAttempt = 0;
        p.finishedCurrentWord = false;
        p.solvedCurrentWord = false;
    }

    io.to(room.id).emit("br_sudden_death", {
        round: room.currentRound,
        roundTimerEndsAt: room.roundTimerEndsAt,
        serverNow: Date.now(),
        survivors: survivors.map(p => ({ socketId: p.socketId, name: p.name })),
    });

    for (const p of survivors) {
        const socket = io.sockets.sockets.get(p.socketId);
        socket?.emit("br_round_start", {
            round: room.currentRound,
            word: newWord,
            roundTimerEndsAt: room.roundTimerEndsAt,
            serverNow: Date.now(),
            players: room.players.map(pl => ({
                socketId: pl.socketId,
                name: pl.name,
                wordsResolved: pl.wordsResolved,
                currentAttempt: 0,
                finishedCurrentWord: false,
                isEliminated: pl.isEliminated,
                abandoned: pl.abandoned,
            })),
            isSuddenDeath: true,
        });
    }

    room.roundTimer = setTimeout(() => {
        handleSuddenDeathTimeout(io, room);
    }, duration);
}

function handleSuddenDeathTimeout(io: Server, room: BattleRoyaleRoom) {
    const survivors = room.players.filter(p => !p.isEliminated);
    const solved = survivors.filter(p => p.solvedCurrentWord);

    if (solved.length === 1) {
        endBRMatch(io, room, solved[0]);
    } else if (solved.length > 1) {
        endBRMatch(io, room, solved[0]);
    } else {
        startSuddenDeath(io, room);
    }
}

export function handleSuddenDeathRowResolved(
    io: Server,
    room: BattleRoyaleRoom,
    socketId: string,
    data: {
        wordIndex: number;
        wasSolved: boolean;
        wordFinished: boolean;
        lastEval: ("correct" | "present" | "absent")[];
    }
) {
    if (room.status !== "sudden_death") return;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player || player.isEliminated) return;
    if (data.wordIndex !== room.currentRound) return;
    if (player.finishedCurrentWord) return;

    player.currentAttempt++;

    if (data.wordFinished) {
        player.finishedCurrentWord = true;
        player.solvedCurrentWord = data.wasSolved;
        if (data.wasSolved) {
            player.wordsResolved++;
        }
    }

    io.to(room.id).emit("br_player_progress", {
        socketId,
        name: player.name,
        wordsResolved: player.wordsResolved,
        currentAttempt: player.currentAttempt,
        finishedCurrentWord: player.finishedCurrentWord,
        solvedCurrentWord: player.solvedCurrentWord,
        wasSolved: data.wasSolved,
        evaluation: data.lastEval,
    });

    const socket = io.sockets.sockets.get(socketId);
    socket?.emit("br_row_ack", {
        accepted: true,
        currentAttempt: player.currentAttempt,
        currentWordIndex: player.currentWordIndex,
    });

    if (!data.wordFinished) return;

    if (data.wasSolved) {
        if (room.roundTimer) {
            clearTimeout(room.roundTimer);
            room.roundTimer = null;
        }
        endBRMatch(io, room, player);
        return;
    }

    const activePlayers = room.players.filter(p => !p.isEliminated);
    const allFinished = activePlayers.every(p => p.finishedCurrentWord);
    const anyoneSolved = activePlayers.some(p => p.solvedCurrentWord);

    if (allFinished && !anyoneSolved) {
        if (room.roundTimer) {
            clearTimeout(room.roundTimer);
            room.roundTimer = null;
        }
        startSuddenDeath(io, room);
    }
}

function calculateCups(
    player: BRPlayerState,
    totalPlayers: number
): number {
    if (player.abandoned) return -15;

    const pos = player.finalPosition ?? totalPlayers;

    if (pos === totalPlayers) return -15;

    if (player.isEliminated && (player.eliminatedAtRound ?? 0) === 0) return -15;

    switch (pos) {
        case 1: return 50;
        case 2: return 20;
        case 3: return 10;
        default: return 5;
    }
}

export function endBRMatch(io: Server, room: BattleRoyaleRoom, winner: BRPlayerState | null) {
    if (room.status === "finished") return;

    const reachedSuddenDeath = room.status === "sudden_death";
    room.status = "finished";

    room.winner = winner?.socketId;

    if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
    }

    const survivors = room.players.filter(p => !p.isEliminated);
    const eliminated = room.players.filter(p => p.isEliminated);

    eliminated.sort((a, b) => {
        const ra = a.eliminatedAtRound ?? -1;
        const rb = b.eliminatedAtRound ?? -1;
        if (rb !== ra) return rb - ra;
        return b.wordsResolved - a.wordsResolved;
    });

    survivors.sort((a, b) => b.wordsResolved - a.wordsResolved);

    const ordered = [...survivors, ...eliminated];
    ordered.forEach((p, i) => { p.finalPosition = i + 1; });

    const cupsMap: Record<string, number> = {};
    for (const p of room.players) {
        cupsMap[p.socketId] = calculateCups(p, room.players.length);
    }

    io.to(room.id).emit("br_game_over", {
        winnerId: winner?.socketId ?? null,
        winnerName: winner?.name ?? null,
        finalPositions: ordered.map(p => ({
            socketId: p.socketId,
            name: p.name,
            position: p.finalPosition,
            wordsResolved: p.wordsResolved,
            cupsChange: cupsMap[p.socketId],
            abandoned: p.abandoned,
        })),
        reachedSuddenDeath,
    });

    room.cleanupTimer = setTimeout(() => {
        deleteRoom(room.id);
    }, 60_000);
}