"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGame } from "./use-game";
import type { LetterState } from "@/utils/evaluateWord";
import { applyCompetitiveResult, loadCompetitiveProfile, saveCompetitiveProfile } from "@/utils/competitive";
import { CompetitiveProfile, CompetitiveResult } from "@/data/competitive-res";
import { RivalUpdate } from "@/data/rival-update-type";
import { GameFinishedPayload } from "@/data/game-finished-payload-type";

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

    const [profile, setProfile] = useState<CompetitiveProfile>(() => loadCompetitiveProfile());
    const [lastMatchDelta, setLastMatchDelta] = useState<number | null>(null);
    const finishAppliedRef = useRef(false);

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
                saveCompetitiveProfile(updated);
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
        if (subscribedRef.current) return;
        subscribedRef.current = true;

        const unsub = game.onRevealComplete(({ rowIndex, wasSolved, evaluation, wordFinished, exhausted }) => {
            const s = socketRef.current;
            if (!s) return;

            const wIdx = idxRef.current;
            const key = `${wIdx}:${rowIndex}`;

            if (lastHandledKeyRef.current === key) return;
            lastHandledKeyRef.current = key;

            if (wordFinished) {
                s.emit("row_resolved", {
                    code: roomId,
                    wordIndex: wIdx,
                    wasSolved,
                    lastEval: evaluation,
                    wordFinished: true,
                });

                setRoundResultsPlayer(prev => {
                    const next = [...prev];
                    next[wIdx] = wasSolved ? "win" : "loss";
                    return next;
                });

                if (wasSolved)
                    setScore((x) => x + 1);

                const next = wIdx + 1;
                idxRef.current = next;
                lastHandledKeyRef.current = null;

                if (next < wordsRef.current.length)
                    game.startMultiplayerRound(wordsRef.current[next]);
            }
        });

        return () => {
            unsub?.();
            subscribedRef.current = false;
        }
    }, [game]);

    const createRoom = (name: string) => {
        setMyName(name);
        socketRef.current?.emit("create_room", { name })
    };
    const joinRoom = (code: string, name: string) => {
        setRoomId(code);
        setMyName(name);
        socketRef.current?.emit("join_room", { code, name });
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

    const findMatch = (name: string, cups?: number) => {
        setStatus("queueing");
        setRoomId(null);
        setMyName(name);
        socketRef.current?.emit("find_match", { name, cups });
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
        resetCompetitiveProfile: () => {
            const fresh = loadCompetitiveProfile();
            saveCompetitiveProfile(fresh);
            setProfile(fresh);
            setLastMatchDelta(null);
        },
    };
}