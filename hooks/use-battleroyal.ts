"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getCurrentUser } from "@/lib/auth-client";
import { getBRProfile, saveBRProfile, updateLeaderboardFromBRProfile } from "@/utils/br-competitive-firestore";
import { applyBRResult, normalizeBRProfile } from "@/utils/br-competitive";

export type BRGamePhase =
    | "idle"
    | "queue"
    | "lobby"
    | "countdown"
    | "round_active"
    | "round_end"
    | "sudden_death"
    | "spectator"
    | "finished";

export interface BRPlayer {
    socketId: string;
    name: string;
    isHost: boolean;
    wordsResolved: number;
    currentAttempt: number;
    finishedCurrentWord: boolean;
    solvedCurrentWord: boolean;
    isEliminated: boolean;
    abandoned: boolean;
}

export interface BRFinalPosition {
    socketId: string;
    name: string;
    position: number;
    wordsResolved: number;
    cupsChange: number;
    abandoned: boolean;
}

export interface BRRoundResult {
    round: number;
    eliminated: { socketId: string; name: string }[];
    survivors: { socketId: string; name: string }[];
}

export interface BRGameOverData {
    winnerId: string | null;
    winnerName: string | null;
    finalPositions: BRFinalPosition[];
    reachedSuddenDeath: boolean;
}

export function useBattleRoyale() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [mySocketId, setMySocketId] = useState<string | null>(null);

    const [phase, setPhase] = useState<BRGamePhase>("idle");

    const [lobbyPlayers, setLobbyPlayers] = useState<{ socketId: string; name: string; isHost: boolean }[]>([]);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [canStart, setCanStart] = useState(false);

    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [players, setPlayers] = useState<BRPlayer[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [currentWord, setCurrentWord] = useState<string | null>(null);
    const [roundTimerEndsAt, setRoundTimerEndsAt] = useState<number | null>(null);
    const [isSuddenDeath, setIsSuddenDeath] = useState(false);
    const [lastRoundResult, setLastRoundResult] = useState<BRRoundResult | null>(null);
    const [gameOverData, setGameOverData] = useState<BRGameOverData | null>(null);

    const roomIdRef = useRef<string | null>(null);
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

    const myNameRef = useRef<string>("");

    useEffect(() => {
        const s = io(process.env.NEXT_PUBLIC_SOCKET_URL);
        socketRef.current = s;
        setSocket(s);

        s.on("connect", () => {
            setMySocketId(s.id ?? null);
        });

        s.on("br_lobby_update", (d: {
            players: { socketId: string; name: string; isHost: boolean }[];
            countdownSeconds: number;
            canStart: boolean;
        }) => {
            setLobbyPlayers(d.players);
            setCountdownSeconds(d.countdownSeconds);
            setCanStart(d.canStart);
            setPhase(prev => prev === "idle" || prev === "queue" ? "lobby" : prev);
        });

        s.on("br_match_found", (d: { code: string; roomId: string }) => {
            setRoomId(d.roomId);
            setRoomCode(d.code);
            setPlayers([]);
            setPhase("countdown");
        });

        s.on("countdown_tick", (n: number) => {

        });

        s.on("br_round_start", (d: {
            round: number;
            word: string;
            roundTimerEndsAt: number;
            serverNow: number;
            players: BRPlayer[];
            isSuddenDeath?: boolean;
        }) => {
            const offset = d.serverNow ? Date.now() - d.serverNow : 0;
            setCurrentRound(d.round);
            setCurrentWord(d.word.toUpperCase());
            setRoundTimerEndsAt(d.roundTimerEndsAt + offset);
            setLastRoundResult(null);
            setIsSuddenDeath(!!d.isSuddenDeath);

            if (d.players?.length) {
                setPlayers(d.players.map(p => ({ ...p, isHost: false, solvedCurrentWord: false })));
            }

            setPhase(prev => {
                if (prev === "spectator") return "spectator";
                if (d.isSuddenDeath) return "sudden_death";
                return "round_active";
            });
        });

        s.on("br_player_progress", (d: {
            socketId: string;
            name: string;
            wordsResolved: number;
            currentAttempt: number;
            finishedCurrentWord: boolean;
            solvedCurrentWord?: boolean;
        }) => {
            setPlayers(prev => {
                const exists = prev.find(p => p.socketId === d.socketId);
                if (exists) {
                    return prev.map(p =>
                        p.socketId === d.socketId
                            ? {
                                ...p,
                                wordsResolved: d.wordsResolved,
                                currentAttempt: d.currentAttempt,
                                finishedCurrentWord: d.finishedCurrentWord,
                                solvedCurrentWord: d.solvedCurrentWord ?? p.solvedCurrentWord,
                            }
                            : p
                    );
                }
                return [...prev, {
                    socketId: d.socketId,
                    name: d.name,
                    isHost: false,
                    wordsResolved: d.wordsResolved,
                    currentAttempt: d.currentAttempt,
                    finishedCurrentWord: d.finishedCurrentWord,
                    solvedCurrentWord: d.solvedCurrentWord ?? false,
                    isEliminated: false,
                    abandoned: false,
                }];
            });
        });

        s.on("br_round_end", (d: BRRoundResult) => {
            setLastRoundResult(d);
            if (d.eliminated.length > 0) {
                console.log("[BR] round_end myId:", s.id, "eliminated:", d.eliminated);
                setPlayers(prev =>
                    prev.map(p =>
                        d.eliminated.find(e => e.socketId === p.socketId)
                            ? { ...p, isEliminated: true }
                            : p
                    )
                );
            }
            setPhase(prev => {
                if (prev === "spectator") return "spectator";
                const myId = socketRef.current?.id ?? "";
                const iWasEliminated = d.eliminated.some(e => e.socketId === myId);
                if (iWasEliminated) return "spectator";
                return "round_end";
            });
        });

        s.on("br_sudden_death", (d: {
            round: number;
            roundTimerEndsAt: number;
            serverNow?: number;
            survivors: { socketId: string; name: string }[];
        }) => {
            const offset = d.serverNow ? Date.now() - d.serverNow : 0;
            setCurrentRound(d.round);
            setRoundTimerEndsAt(d.roundTimerEndsAt + offset);
            setIsSuddenDeath(true);
            setPlayers(prev =>
                prev.map(p => ({
                    ...p,
                    currentAttempt: 0,
                    finishedCurrentWord: false,
                    solvedCurrentWord: false,
                }))
            );
            setPhase(prev => prev === "spectator" ? "spectator" : "sudden_death");
        });

        s.on("br_player_abandoned", (d: { socketId: string }) => {
            setPlayers(prev =>
                prev.map(p =>
                    p.socketId === d.socketId
                        ? { ...p, isEliminated: true, abandoned: true }
                        : p
                )
            );
        });

        s.on("br_game_over", async (d: BRGameOverData) => {
            setGameOverData(d);
            setPhase("finished");

            const user = getCurrentUser();
            if (!user) return;

            const myResult = d.finalPositions.find(p => p.socketId === s.id);
            if (!myResult) return;

            try {
                const freshProfile = await getBRProfile(user.uid);
                const updated = applyBRResult(normalizeBRProfile(freshProfile), {
                    finalPosition: myResult.position,
                    wordsResolved: myResult.wordsResolved,
                    totalRounds: currentRound + 1,
                    eliminatedAtRound: myResult.position > 1 ? currentRound : null,
                    playerCount: d.finalPositions.length,
                    opponents: d.finalPositions
                        .filter(p => p.socketId !== s.id)
                        .map(p => p.name),
                    roomId: roomIdRef.current ?? "",
                    abandoned: myResult.abandoned,
                    reachedSuddenDeath: d.reachedSuddenDeath,
                    wonSuddenDeath: d.reachedSuddenDeath
                        ? myResult.position === 1
                        : null,
                    cupsChangeSentByServer: myResult.cupsChange,
                });
                await saveBRProfile(user.uid, updated);
                await updateLeaderboardFromBRProfile(user.uid, updated);
            } catch (e) {
                console.error("[useBattleRoyale] Error guardando perfil BR:", e);
            }
        });

        return () => {
            s.disconnect();
        };
    }, []);

    const isEliminated = players.find(p => p.socketId === mySocketId)?.isEliminated ?? false;
    const isSpectator = phase === "spectator";
    const isHost = lobbyPlayers[0]?.socketId === mySocketId;

    const getDefaultName = () => {
        const u = getCurrentUser();
        return u?.displayName ?? u?.email?.split("@")[0] ?? "Jugador";
    };

    const joinQueue = useCallback((name?: string) => {
        const finalName = (name?.trim()) || getDefaultName();
        myNameRef.current = finalName;
        socketRef.current?.emit("br_join_queue", { name: finalName });
        setPhase("queue");
    }, []);

    const cancelQueue = useCallback(() => {
        socketRef.current?.emit("br_cancel_queue");
        resetState();
    }, []);

    const forceStart = useCallback(() => {
        socketRef.current?.emit("br_force_start");
    }, []);

    const submitRow = useCallback((data: {
        wordIndex: number;
        wasSolved: boolean;
        wordFinished: boolean;
        lastEval: ("correct" | "present" | "absent")[];
    }) => {
        const rid = roomIdRef.current;
        if (!rid) return;
        socketRef.current?.emit("br_row_resolved", { roomId: rid, ...data });
    }, []);

    const leaveAsSpectator = useCallback(() => {
        resetState();
    }, []);

    const resetState = useCallback(() => {
        setPhase("idle");
        setLobbyPlayers([]);
        setCountdownSeconds(0);
        setCanStart(false);
        setRoomId(null);
        setRoomCode(null);
        setPlayers([]);
        setCurrentRound(0);
        setCurrentWord(null);
        setRoundTimerEndsAt(null);
        setIsSuddenDeath(false);
        setLastRoundResult(null);
        setGameOverData(null);
    }, []);

    return {
        phase,
        lobbyPlayers,
        countdownSeconds,
        canStart,
        isHost,
        roomId,
        roomCode,
        players,
        currentRound,
        currentWord,
        roundTimerEndsAt,
        isSuddenDeath,
        lastRoundResult,
        gameOverData,
        mySocketId,
        isEliminated,
        isSpectator,
        joinQueue,
        cancelQueue,
        forceStart,
        submitRow,
        leaveAsSpectator,
        resetState,
    };
}