"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGame } from "./use-game";
import type { LetterState } from "@/utils/evaluateWord";
import { applyCompetitiveResult } from "@/utils/competitive";
import { CompetitiveProfile, CompetitiveResult } from "@/data/competitive-res";
import { RivalUpdate } from "@/data/rival-update-type";
import { GameFinishedPayload } from "@/data/game-finished-payload-type";
import { getCurrentUser } from "@/lib/auth-client";
import { getCompetitiveProfile, saveCompetitiveProfileToFirestore, updateLeaderboardFromProfile } from "@/utils/competitive-firestore";

const EMPTY_PROFILE: CompetitiveProfile = {
    cups: 0, wins: 0, losses: 0, draws: 0, gamesPlayed: 0,
    lastUpdated: new Date().toISOString(),
    history: [],
};

export function useMultiplayer() {
    const game = useGame();

    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const [roomId, setRoomId] = useState<string | null>(null);
    const [status, setStatus] = useState<"waiting" | "queueing" | "countdown" | "playing" | "finished">("waiting");
    const [countdown, setCountdown] = useState(3);
    const [winner, setWinner] = useState<string | null>(null);
    const [myName, setMyName] = useState<string>("");
    const [opponentName, setOpponentName] = useState<string>("");

    const [score, setScore] = useState(0);

    const [rivalScore, setRivalScore] = useState(0);
    const [rivalWordIndex, setRivalWordIndex] = useState(0);
    const [rivalBoard, setRivalBoard] = useState<(LetterState | null)[][]>([]);

    const [roundResultsPlayer, setRoundResultsPlayer] = useState<("win" | "loss" | null)[]>([null, null, null]);
    const [roundResultsRival, setRoundResultsRival] = useState<("win" | "loss" | null)[]>([null, null, null]);

    const [rematchStatus, setRematchStatus] = useState<"idle" | "waiting" | "countdown" | "declined">("idle");
    const [mySocketId, setMySocketId] = useState<string | null>(null);
    const [winnerSocketId, setWinnerSocketId] = useState<string | "draw" | null>(null);

    const wordsRef = useRef<string[]>([]);
    const idxRef = useRef(0);

    const lastHandledKeyRef = useRef<string | null>(null);
    const subscribedRef = useRef(false);
    const processedRevealKeysRef = useRef<Set<string>>(new Set());

    const [profile, setProfile] = useState<CompetitiveProfile>(EMPTY_PROFILE);
    const [lastMatchDelta, setLastMatchDelta] = useState<number | null>(null);
    const finishAppliedRef = useRef(false);

    const getDefaultName = () => {
        const u = getCurrentUser();
        return u?.displayName ?? u?.email?.split("@")[0] ?? "Jugador";
    };

    useEffect(() => {
        const user = getCurrentUser();
        console.log(user)
        if (!user) return;

        getCompetitiveProfile(user.uid).then(setProfile);
    }, []);

    useEffect(() => {
        const s = io(process.env.NEXT_PUBLIC_SOCKET_URL);
        socketRef.current = s;
        setSocket(s);

        s.on("connect", () => {
            setMySocketId(s.id ?? null);
        });

        s.on("disconnect", () => {
            setMySocketId(s.id ?? null);
        });

        s.on("room_created", ({ code }) => {
            setRoomId(code);
            setStatus("waiting");
            setScore(0);
            setRivalScore(0);
            setRivalBoard([]);
            setRivalWordIndex(0);
        });

        s.on("join_error", () => {
            setStatus("waiting");
        });

        s.on("room_ready", () => {
            finishAppliedRef.current = false;
            processedRevealKeysRef.current.clear();
            setLastMatchDelta(null);
            setRematchStatus("countdown");
            setStatus("countdown");
            setCountdown(3);
            setScore(0);
            setRivalScore(0);
            setRoundResultsPlayer([null, null, null]);
            setRoundResultsRival([null, null, null]);
            setRivalBoard([]);
            setRivalWordIndex(0);
        });

        s.on("countdown_tick", (n) => {
            setCountdown(n);
        });

        s.on("game_start", ({ words }) => {
            wordsRef.current = words.map((w: string) => w.toUpperCase());
            idxRef.current = 0;
            lastHandledKeyRef.current = null;
            finishAppliedRef.current = false;
            processedRevealKeysRef.current.clear();
            setLastMatchDelta(null);

            game.multiplayerMode();
            game.startMultiplayerRound(wordsRef.current[0]);

            setScore(0);
            setRivalScore(0);
            setRivalBoard([]);
            setRivalWordIndex(0);
            setRoundResultsPlayer([null, null, null]);
            setRoundResultsRival([null, null, null]);
            setStatus("playing");
        });

        s.on("rival_progress", (data: RivalUpdate) => {
            setRivalScore(data.solvedCount);

            setRivalWordIndex((prev) => {
                if (data.currentWordIndex !== prev) {
                    setRivalBoard([]);
                }
                return data.currentWordIndex;
            });

            setRivalBoard((prev) => [...prev, data.evaluation]);

            if (data.wordFinished && typeof data.wordIndex === "number") {
                const idx = data.wordIndex;
                const solved = !!data.wasSolved;
                setRoundResultsRival(prev => {
                    const next = [...prev];
                    next[idx] = solved ? "win" : "loss";
                    return next;
                });
            }
        });

        s.on("opponent_info", (payload: {
            mySocketId: string;
            myName: string;
            opponentSocketId: string;
            opponentName: string;
            roomCode: string;
        }) => {
            setMySocketId(payload.mySocketId ?? null);
            setMyName(payload.myName || myName);
            console.log("[SOCKET] opponent_info", payload);
            setOpponentName(payload.opponentName || "");
            setRoomId(payload.roomCode);
        });

        s.on("game_finished", (data: GameFinishedPayload) => {
            if (finishAppliedRef.current) {
                setStatus("finished");
                setRematchStatus("idle");
                return;
            }
            finishAppliedRef.current = true;

            const myId = socketRef.current?.id ?? null;

            let result: CompetitiveResult;
            if (!data.winnerSocketId || data.winnerSocketId === "draw") {
                result = "draw";
            } else {
                result = data.winnerSocketId === myId ? "win" : "lose";
            }

            setProfile(prev => {
                const updated = applyCompetitiveResult(prev, result, {
                    roomCode: roomId,
                    opponentId: data.scores?.find(s => s.socketId !== myId)?.socketId ?? null,
                });

                const user = getCurrentUser();
                if (user) {
                    saveCompetitiveProfileToFirestore(user.uid, updated);
                    updateLeaderboardFromProfile(user.uid, updated);
                }

                setLastMatchDelta(updated.cups - prev.cups);
                return updated;
            });

            setWinner(data.winnerName);
            setWinnerSocketId(data.winnerSocketId ?? null);
            setStatus("finished");
            setRematchStatus("idle");
        });

        s.on("rematch_update", ({ requested }: { requested: string[] }) => {
            const myId = socketRef.current?.id;
            if (myId && requested.includes(myId) && requested.length === 1) {
                setRematchStatus("waiting");
            }
        });

        s.on("rematch_declined", () => {
            setRematchStatus("declined");
        });

        s.on("queue_update", (payload: any) => {
            if (payload?.status === "enqueued") {
                setStatus("queueing");
            } else if (payload?.status === "cancelled") {
                setStatus("waiting");
            }
        });

        s.on("match_found", ({ code, opponentName }) => {
            setRoomId(code);
        });

        return () => {
            s.off("connect");
            s.off("disconnect");
            s.off("reconnect");
            s.off("rematch_update");
            s.off("room_created");
            s.off("join_error");
            s.off("room_ready");
            s.off("countdown_tick");
            s.off("game_start");
            s.off("rival_progress");
            s.off("game_finished");
            s.off("queue_update");
            s.off("match_found");
            s.off("opponent_info");
            s.disconnect();
            socketRef.current = null;
        }
    }, []);

    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        const onRowAck = (payload: {
            accepted: boolean;
            currentWordIndex?: number;
            expected?: number;
            received?: number;
            wordJustFinished?: number;
            wasSolved?: boolean;
        }) => {
            if (!payload) return;

            if (!payload.accepted) {
                console.warn("[SOCKET] row_ack rejected", payload);
                return;
            }

            const next = payload.currentWordIndex ?? idxRef.current;
            if (next > idxRef.current && next < wordsRef.current.length) {
                idxRef.current = next;
                processedRevealKeysRef.current.clear();
                game.startMultiplayerRound(wordsRef.current[next]);
            }

        };

        s.on("row_ack", onRowAck);
        return () => {
            s.off("row_ack", onRowAck);
        };
    }, [game]);

    useEffect(() => {
        if (subscribedRef.current) return;
        subscribedRef.current = true;

        const unsub = game.onRevealComplete(
            ({ rowIndex, wasSolved, evaluation, wordFinished, exhausted, solution, guess }) => {
                const s = socketRef.current;
                if (!s) return;

                const sol = solution?.toUpperCase?.() ?? solution;
                const dedupeKey = `${sol}:${rowIndex}`;
                if (!wordFinished) return;
                if (processedRevealKeysRef.current.has(dedupeKey)) return;
                processedRevealKeysRef.current.add(dedupeKey);

                let wIdxFromSolution = wordsRef.current.findIndex((w) => w === sol);
                if (wIdxFromSolution < 0) {
                    wIdxFromSolution = idxRef.current;
                }

                s.emit("row_resolved", {
                    code: roomId,
                    wordIndex: wIdxFromSolution,
                    wasSolved,
                    lastEval: evaluation,
                    wordFinished: true,
                });

                setRoundResultsPlayer((prev) => {
                    const next = [...prev];
                    next[wIdxFromSolution] = wasSolved ? "win" : "loss";
                    return next;
                });
                if (wasSolved) setScore((x) => x + 1);

                console.log("[REVEAL]", {
                    sol,
                    rowIndex,
                    wordFinished,
                    wasSolved,
                    idxRef: idxRef.current,
                    wIdxFromSolution,
                    deduped: processedRevealKeysRef.current.has(dedupeKey),
                });

                lastHandledKeyRef.current = null;
            }
        );

        return () => {
            unsub?.();
            subscribedRef.current = false;
        };
    }, [game]);


    const createRoom = (name?: string) => {
        const u = getCurrentUser();
        if (!u) return;
        const finalName = (name && name.trim()) || getDefaultName();
        setMyName(finalName);
        socketRef.current?.emit("create_room", { name: finalName });
    };

    const joinRoom = (code: string, name?: string) => {
        const u = getCurrentUser();
        if (!u) return;
        const finalName = (name && name.trim()) || getDefaultName();
        setRoomId(code);
        setMyName(finalName);
        socketRef.current?.emit("join_room", { code, name: finalName });
    };

    const requestRematch = () => {
        if (!roomId) return;
        socketRef.current?.emit("request_rematch", { code: roomId });
    };

    const leaveRoom = () => {
        if (!roomId) return;
        socketRef.current?.emit("leave_room", { code: roomId });
        setRoomId(null);
        setMyName("");
        setOpponentName("");
        setStatus("waiting");
        setWinnerSocketId(null);
        setRematchStatus("idle");
    };

    const findMatch = (name?: string, cups?: number) => {
        const u = getCurrentUser();
        if (!u) return;
        const finalName = (name && name.trim()) || getDefaultName();
        setStatus("queueing");
        setRoomId(null);
        setMyName(finalName);
        socketRef.current?.emit("find_match", { name: finalName, cups });
    };

    const cancelFind = () => {
        socketRef.current?.emit("cancel_find");
        setStatus("waiting");
    };

    return {
        roomId,
        gameStatus: status,
        countdown,
        winner,
        score,
        rivalScore,
        rivalWordIndex,
        rivalBoard,
        roundResultsPlayer,
        roundResultsRival,
        winnerSocketId,
        rematchStatus,
        mySocketId,
        socket,
        currentWordIndex: idxRef.current,
        guesses: game.guesses,
        evaluations: game.evaluations,
        currentGuess: game.currentGuess,
        currentRow: game.currentRow,
        revealingRow: game.revealingRow,
        keyboardColors: game.keyboardColors,
        toastMessage: game.toastMessage,
        handleKeyPress: game.handleKeyPress,
        handleRevealComplete: game.finishReveal,
        getCompetitiveCups: game.getCompetitiveCups,
        createRoom,
        joinRoom,
        leaveRoom,
        requestRematch,
        findMatch,
        cancelFind,
        myName,
        opponentName,
        competitive: {
            cups: profile.cups,
            wins: profile.wins,
            losses: profile.losses,
            draws: profile.draws,
            gamesPlayed: profile.gamesPlayed,
            lastMatchDelta,
            history: profile.history,
        },
    };
}