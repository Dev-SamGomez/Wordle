import { Server } from "socket.io";
import { BattleRoyaleRoom, BRPlayerState } from "./brTypes";
import { deleteRoom } from "./rooms";
import { getThreeRandomWords } from "./wordService";

const ROUND_TIMERS = [300, 240, 180, 120, 60];

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

    player.currentAttempt++;

    io.to(room.id).emit("br_player_progress", {
        socketId,
        name: player.name,
        wordsResolved: player.wordsResolved,
        currentWordIndex: player.currentWordIndex,
        currentAttempt: player.currentAttempt,
        finishedCurrentWord: player.finishedCurrentWord,
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

    player.finishedCurrentWord = true;
    player.solvedCurrentWord = data.wasSolved;
    if (data.wasSolved) {
        player.wordsResolved++;
        player.currentWordIndex++;
    }

    const activePlayers = room.players.filter(p => !p.isEliminated);
    const allDone = activePlayers.every(p => p.finishedCurrentWord);
    if (allDone) {
        room.allFinishedCurrent = true;
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

    const failed = activePlayers.filter(p => !p.solvedCurrentWord);

    let toEliminate: BRPlayerState[] = [];

    if (failed.length > 0) {
        toEliminate = failed;
    } else {
        const maxAttempts = Math.max(...activePlayers.map(p => p.currentAttempt));
        toEliminate = activePlayers.filter(p => p.currentAttempt === maxAttempts);

        if (toEliminate.length === activePlayers.length) {
            toEliminate = [];
        }
    }

    for (const p of toEliminate) {
        p.isEliminated = true;
        p.eliminatedAtRound = room.currentRound;
        room.eliminatedPlayers.push(p.socketId);
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

    setTimeout(() => {
        advanceRound(io, room);
    }, 4000);
}

function advanceRound(io: Server, room: BattleRoyaleRoom) {
    const survivors = room.players.filter(p => !p.isEliminated);

    if (survivors.length <= 1) {
        endBRMatch(io, room, survivors[0] ?? null);
        return;
    }

    const isLastRound = room.currentRound >= room.words.length - 1;
    if (isLastRound) {
        startSuddenDeath(io, room);
        return;
    }

    room.currentRound++;
    startBRRound(io, room);
}

function startSuddenDeath(io: Server, room: BattleRoyaleRoom) {
    room.status = "sudden_death";

    const newWord = getThreeRandomWords().find(w => !room.words.includes(w))
        ?? getThreeRandomWords()[0];
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
    });

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
    data: { wasSolved: boolean; wordFinished: boolean; lastEval: ("correct" | "present" | "absent")[] }
) {
    const player = room.players.find(p => p.socketId === socketId);
    if (!player || player.isEliminated || room.status !== "sudden_death") return;

    player.currentAttempt++;

    io.to(room.id).emit("br_player_progress", {
        socketId,
        name: player.name,
        wordsResolved: player.wordsResolved,
        currentAttempt: player.currentAttempt,
        finishedCurrentWord: player.finishedCurrentWord,
        wasSolved: data.wasSolved,
        evaluation: data.lastEval,
    });

    if (!data.wordFinished) return;

    player.finishedCurrentWord = true;
    player.solvedCurrentWord = data.wasSolved;

    if (data.wasSolved) {
        if (room.roundTimer) clearTimeout(room.roundTimer);
        endBRMatch(io, room, player);
    }
}

function endBRMatch(io: Server, room: BattleRoyaleRoom, winner: BRPlayerState | null) {
    const reachedSuddenDeath = room.status === "sudden_death";

    room.status = "finished";
    room.winner = winner?.socketId;

    if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
    }

    const ordered = [...room.players].sort((a, b) => {
        if (!a.isEliminated && b.isEliminated) return -1;
        if (a.isEliminated && !b.isEliminated) return 1;

        if (!a.isEliminated && !b.isEliminated) {
            return b.wordsResolved - a.wordsResolved;
        }

        const roundA = a.eliminatedAtRound ?? -1;
        const roundB = b.eliminatedAtRound ?? -1;
        if (roundB !== roundA) return roundB - roundA;
        return b.wordsResolved - a.wordsResolved;
    });

    ordered.forEach((p, i) => { p.finalPosition = i + 1; });

    const cupsMap: Record<string, number> = {};
    for (const p of room.players) {
        const delta = p.abandoned ? -10 :
            p.finalPosition === 1 ? 50 :
                p.finalPosition === 2 ? 20 :
                    p.finalPosition === 3 ? 10 :
                        p.finalPosition === 4 ? 5 : 0;
        cupsMap[p.socketId] = delta;
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