"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WORDS } from "@/data/words";
import { evaluateGuess, type LetterState } from "@/lib/utils/evaluateWord";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase-client";
import { doc, onSnapshot } from "firebase/firestore";

export type { LetterState };
export type Evaluation = LetterState;
export type GameStatus = "playing" | "won" | "lost";
export type KeyboardColors = Record<string, LetterState>;
export type GameMode = "solitaire" | "daily" | "multiplayer";
export interface GameState {
  solution: string;
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  currentRow: number;
  gameStatus: GameStatus;
  toastMessage: string;
  keyboardColors: KeyboardColors;
  revealingRow: number | null;
  gameMode: GameMode;
  streaks: Streaks;
}

const uniqueWords = [...new Set(WORDS.map((w) => w.toUpperCase()))];

const a = 157;
const b = 263;
const p = 10000019;

const wordDay = (): string => {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const D = dia * 1000000 + mes * 10000 + anio;
  const hash = ((a * D + b) % p) % uniqueWords.length;
  return uniqueWords[hash];
}

const getTodayKey = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}
interface DailyState {
  date: string;
  guesses: string[];
  evaluations: LetterState[][];
  keyboardColors: KeyboardColors;
  gameStatus: GameStatus;
}
interface SoloState extends DailyState {
  solutionIndex: number;
}
export interface Streaks {
  dailyStreak: number;
  dailyLastWinDate: string;
  solitaireStreak: number;
}

const DEFAULT_STREAKS: Streaks = { dailyStreak: 0, dailyLastWinDate: "", solitaireStreak: 0 };

const loadStreaks = (): Streaks => {
  if (typeof window === "undefined") return DEFAULT_STREAKS;
  try {
    const raw = localStorage.getItem("wordle-streaks");
    if (!raw) return { ...DEFAULT_STREAKS };
    const parsed = JSON.parse(raw);
    return {
      dailyStreak: parsed.dailyStreak ?? 0,
      dailyLastWinDate: parsed.dailyLastWinDate ?? "",
      solitaireStreak: parsed.solitaireStreak ?? 0,
    };
  } catch {
    return { ...DEFAULT_STREAKS };
  }
}

const SOLO_STORAGE_KEY = "wordle-solo";
const loadSoloState = (): SoloState | null => {
  try {
    const raw = localStorage.getItem(SOLO_STORAGE_KEY);
    if (!raw) return null;

    const parsed: any = JSON.parse(raw);
    if (typeof parsed.solutionIndex !== "number") {
      const candidate = typeof parsed.solution === "string" ? parsed.solution.toUpperCase() : "";
      const idx = uniqueWords.indexOf(candidate);
      if (idx >= 0) {
        const migrated: SoloState = {
          date: parsed.date ?? getTodayKey(),
          solutionIndex: idx,
          guesses: parsed.guesses ?? [],
          evaluations: parsed.evaluations ?? [],
          keyboardColors: parsed.keyboardColors ?? {},
          gameStatus: parsed.gameStatus ?? "playing",
        };
        localStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return null;
    }
    if (!Array.isArray(parsed.guesses) || !Array.isArray(parsed.evaluations)) return null;
    return parsed as SoloState;
  } catch {
    return null;
  }
}

const saveSoloState = (state: SoloState) => {
  localStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(state));
}

const clearSoloState = () => {
  localStorage.removeItem(SOLO_STORAGE_KEY);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const editable = target.closest("input, textarea, [contenteditable=''], [contenteditable='true']");
  if (editable) {
    if (editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement) {
      if (editable.disabled || editable.readOnly) return false;
    }
    return true;
  }

  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") return true;

  if (target.closest("[data-ignore-global-keys='true']")) return true;

  return false;
}

const saveStreaks = (streaks: Streaks) => {
  localStorage.setItem("wordle-streaks", JSON.stringify(streaks));
}

const getYesterdayKey = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
}

const updateDailyStreak = (won: boolean): Streaks => {
  const streaks = loadStreaks();
  const todayKey = getTodayKey();

  if (streaks.dailyLastWinDate === todayKey) return streaks;

  if (won) {
    const yesterdayKey = getYesterdayKey();
    const isConsecutive = streaks.dailyLastWinDate === yesterdayKey;
    streaks.dailyStreak = isConsecutive ? streaks.dailyStreak + 1 : 1;
    streaks.dailyLastWinDate = todayKey;
  } else {
    streaks.dailyStreak = 0;
  }

  saveStreaks(streaks);
  return streaks;
}

const updateSolitaireStreak = (won: boolean): Streaks => {
  const streaks = loadStreaks();

  if (won) {
    streaks.solitaireStreak = streaks.solitaireStreak + 1;
  } else {
    streaks.solitaireStreak = 0;
  }

  saveStreaks(streaks);
  return streaks;
}

const loadDailyState = (): DailyState | null => {
  try {
    const raw = localStorage.getItem("wordle-daily");
    if (!raw) return null;
    const parsed: DailyState = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

const saveDailyState = (state: DailyState) => {
  localStorage.setItem("wordle-daily", JSON.stringify(state));
}

const getRandomWord = (usedWords: Set<string>): string => {
  const available = uniqueWords.filter((w) => !usedWords.has(w));
  if (available.length === 0) {
    return uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function useGame() {
  const usedWordsRef = useRef<Set<string>>(new Set());
  const streakCountedRef = useRef(false);
  const lastEmittedRevealRef = useRef<string | null>(null);
  const [competitiveCups, setCompetitiveCups] = useState<number>(0);

  const [state, setState] = useState<GameState>(() => {
    const savedSolo = typeof window !== "undefined" ? loadSoloState() : null;
    if (savedSolo) {
      const word = uniqueWords[savedSolo.solutionIndex];
      return {
        solution: word,
        guesses: savedSolo.guesses,
        evaluations: savedSolo.evaluations,
        currentGuess: "",
        currentRow: savedSolo.guesses.length,
        gameStatus: savedSolo.gameStatus,
        toastMessage: "",
        keyboardColors: savedSolo.keyboardColors ?? {},
        revealingRow: null,
        gameMode: "solitaire",
        streaks: { ...DEFAULT_STREAKS },
      };
    }
    const word = getRandomWord(usedWordsRef.current);
    usedWordsRef.current.add(word);
    const baseline: GameState = {
      solution: word,
      guesses: [],
      evaluations: [],
      currentGuess: "",
      currentRow: 0,
      gameStatus: "playing",
      toastMessage: "",
      keyboardColors: {},
      revealingRow: null,
      gameMode: "solitaire",
      streaks: { ...DEFAULT_STREAKS },
    };
    if (typeof window !== "undefined") {
      const solutionIndex = uniqueWords.indexOf(word);
      saveSoloState({
        date: getTodayKey(),
        solutionIndex,
        guesses: [],
        evaluations: [],
        keyboardColors: {},
        gameStatus: "playing",
      });
    }
    return baseline;
  });

  const { user, authLoading } = useAuth();
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCompetitiveCups(0); return; }

    const deps = getFirebase();
    if (!deps) return;
    const { db } = deps;

    const ref = doc(db, "profiles", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d: any = snap.data();
        setCompetitiveCups(typeof d?.cups === "number" ? d.cups : 0);
      },
      () => setCompetitiveCups(0)
    );

    return () => unsub();
  }, [user, authLoading]);


  useEffect(() => {
    const saved = loadStreaks();
    setState((prev) => ({ ...prev, streaks: saved }));
  }, []);


  useEffect(() => {
    const saved = loadStreaks();
    setState((prev) => ({ ...prev, streaks: saved }));
  }, []);

  const clearToast = useCallback(() => {
    setState((prev) => ({ ...prev, toastMessage: "" }));
  }, []);

  useEffect(() => {
    if (state.toastMessage) {
      const duration = state.gameStatus !== "playing" ? 4000 : 2000;
      const timer = setTimeout(clearToast, duration);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, state.gameStatus, clearToast]);

  const updateKeyboardColors = useCallback(
    (
      currentColors: KeyboardColors,
      guess: string,
      evaluation: LetterState[]
    ): KeyboardColors => {
      const newColors = { ...currentColors };
      const priority: Record<LetterState, number> = {
        correct: 3,
        present: 2,
        absent: 1,
      };

      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const newState = evaluation[i];
        const currentState = newColors[letter];

        if (!currentState || priority[newState] > priority[currentState]) {
          newColors[letter] = newState;
        }
      }

      return newColors;
    },
    []
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      setState((prev) => {
        if (prev.gameStatus !== "playing") return prev;
        if (prev.revealingRow !== null) return prev;

        if (key === "ENTER") {
          if (prev.currentGuess.length !== 5) {
            return { ...prev, toastMessage: "La palabra debe tener 5 letras" };
          }

          const upperGuess = prev.currentGuess.toUpperCase();

          if (!uniqueWords.includes(upperGuess)) {
            return { ...prev, toastMessage: "La palabra no existe" };
          }

          const evaluation = evaluateGuess(upperGuess, prev.solution);
          const newGuesses = [...prev.guesses, upperGuess];
          const newEvaluations = [...prev.evaluations, evaluation];
          const newKeyboardColors = updateKeyboardColors(
            prev.keyboardColors,
            upperGuess,
            evaluation
          );

          const isWin = evaluation.every((s) => s === "correct");
          const isLoss = !isWin && newGuesses.length >= 6;
          const newStatus: GameStatus = isWin
            ? "won"
            : isLoss
              ? "lost"
              : "playing";

          if (prev.gameMode === "daily") {
            saveDailyState({
              date: getTodayKey(),
              guesses: newGuesses,
              evaluations: newEvaluations,
              keyboardColors: newKeyboardColors,
              gameStatus: newStatus,
            });
          }
          else if (prev.gameMode === "solitaire") {
            const solutionIndex = uniqueWords.indexOf(prev.solution);
            saveSoloState({
              date: getTodayKey(),
              solutionIndex,
              guesses: newGuesses,
              evaluations: newEvaluations,
              keyboardColors: newKeyboardColors,
              gameStatus: newStatus,
            });
          }

          return {
            ...prev,
            guesses: newGuesses,
            evaluations: newEvaluations,
            currentGuess: "",
            currentRow: prev.currentRow + 1,
            keyboardColors: newKeyboardColors,
            revealingRow: prev.currentRow,
            toastMessage: "",
          };
        }

        if (key === "BACKSPACE") {

          const next = {
            ...prev,
            currentGuess: prev.currentGuess.slice(0, -1),
          };

          if (prev.gameMode === "solitaire") {
            const solutionIndex = uniqueWords.indexOf(prev.solution);
            saveSoloState({
              date: getTodayKey(),
              solutionIndex,
              guesses: next.guesses,
              evaluations: next.evaluations,
              keyboardColors: next.keyboardColors,
              gameStatus: next.gameStatus,
            });
          }
          if (prev.gameMode === "daily") {
            saveDailyState({
              date: getTodayKey(),
              guesses: next.guesses,
              evaluations: next.evaluations,
              keyboardColors: next.keyboardColors,
              gameStatus: next.gameStatus,
            });
          }

          return next;
        }

        if (prev.currentGuess.length >= 5) return prev;
        if (/^[A-ZÑ]$/.test(key)) {

          const next = {
            ...prev,
            currentGuess: prev.currentGuess + key,
          };

          if (prev.gameMode === "solitaire") {
            const solutionIndex = uniqueWords.indexOf(prev.solution);
            saveSoloState({
              date: getTodayKey(),
              solutionIndex,
              guesses: next.guesses,
              evaluations: next.evaluations,
              keyboardColors: next.keyboardColors,
              gameStatus: next.gameStatus,
            });
          }
          if (prev.gameMode === "daily") {
            saveDailyState({
              date: getTodayKey(),
              guesses: next.guesses,
              evaluations: next.evaluations,
              keyboardColors: next.keyboardColors,
              gameStatus: next.gameStatus,
            });
          }
          return next;
        }

        return prev;
      });
    },
    [updateKeyboardColors]
  );

  const finishReveal = useCallback(() => {
    setState((prev) => {
      if (prev.revealingRow === null) return prev;

      const lastEvaluation = prev.evaluations[prev.evaluations.length - 1];
      if (!lastEvaluation) {
        return { ...prev, revealingRow: null };
      }

      const rowIndex = prev.revealingRow;
      const guess = prev.guesses[prev.guesses.length - 1] ?? "";
      const solution = prev.solution;
      const wasSolved = lastEvaluation.every((s) => s === "correct");
      const exhausted = !wasSolved && prev.guesses.length >= 6;
      const wordFinished = wasSolved || exhausted;

      const revealKey = `${solution}|${rowIndex}|${guess}`;
      if (lastEmittedRevealRef.current !== revealKey) {
        lastEmittedRevealRef.current = revealKey;
        revealSubsRef.current.forEach((cb) => {
          try {
            cb({
              rowIndex,
              evaluation: lastEvaluation,
              guess,
              solution,
              wasSolved,
              exhausted,
              wordFinished,
            });
          } catch { }
        });
      }

      const isWin = wasSolved;
      const isLoss = exhausted;

      let newStreaks = prev.streaks;

      if (prev.gameMode !== "multiplayer") {
        if ((isWin || isLoss) && !streakCountedRef.current) {
          if (prev.gameMode === "daily") {
            newStreaks = updateDailyStreak(isWin);
            streakCountedRef.current = true;
          } else if (prev.gameMode === "solitaire") {
            newStreaks = updateSolitaireStreak(isWin);
            streakCountedRef.current = true;
          }
        }
      }

      return {
        ...prev,
        revealingRow: null,
        gameStatus:
          prev.gameMode === "multiplayer"
            ? "playing"
            : isWin
              ? "won"
              : isLoss
                ? "lost"
                : "playing",
        streaks: newStreaks,
        toastMessage: isWin
          ? "Ganaste!"
          : (prev.gameMode !== "multiplayer" && isLoss)
            ? `Perdiste, Era: ${solution}`
            : "",
      };
    });
  }, []);

  const startMultiplayerRound = useCallback((solutionWord: string) => {
    streakCountedRef.current = false;
    const currentStreaks = loadStreaks();
    setState((prev) => ({
      ...prev,
      solution: solutionWord.toUpperCase(),
      guesses: [],
      evaluations: [],
      currentGuess: "",
      currentRow: 0,
      gameStatus: "playing",
      toastMessage: "",
      keyboardColors: {},
      revealingRow: null,
      gameMode: "multiplayer",
      streaks: currentStreaks,
    }));
  }, []);

  const resetGame = useCallback(() => {
    clearSoloState();
    const word = getRandomWord(usedWordsRef.current);
    usedWordsRef.current.add(word);
    streakCountedRef.current = false;
    const currentStreaks = loadStreaks();

    setState({
      solution: word,
      guesses: [],
      evaluations: [],
      currentGuess: "",
      currentRow: 0,
      gameStatus: "playing",
      toastMessage: "",
      keyboardColors: {},
      revealingRow: null,
      gameMode: "solitaire",
      streaks: currentStreaks,
    });

    const solutionIndex = uniqueWords.indexOf(word);
    saveSoloState({
      date: getTodayKey(),
      solutionIndex,
      guesses: [],
      evaluations: [],
      keyboardColors: {},
      gameStatus: "playing",
    });
  }, []);

  const startSolitaire = useCallback(() => {
    const currentStreaks = loadStreaks();
    const saved = loadSoloState();
    if (saved) {
      setState({
        solution: uniqueWords[saved.solutionIndex],
        guesses: saved.guesses,
        evaluations: saved.evaluations,
        currentGuess: "",
        currentRow: saved.guesses.length,
        gameStatus: saved.gameStatus,
        toastMessage: "",
        keyboardColors: saved.keyboardColors ?? {},
        revealingRow: null,
        gameMode: "solitaire",
        streaks: currentStreaks,
      });
      return;
    }
    setState(() => {
      const word = getRandomWord(usedWordsRef.current);
      usedWordsRef.current.add(word);
      const solutionIndex = uniqueWords.indexOf(word);
      saveSoloState({
        date: getTodayKey(),
        solutionIndex,
        guesses: [],
        evaluations: [],
        keyboardColors: {},
        gameStatus: "playing",
      });
      return {
        solution: word,
        guesses: [],
        evaluations: [],
        currentGuess: "",
        currentRow: 0,
        gameStatus: "playing",
        toastMessage: "",
        keyboardColors: {},
        revealingRow: null,
        gameMode: "solitaire",
        streaks: currentStreaks,
      };
    });
  }, []);

  const startDailyGame = useCallback(() => {
    const daily = wordDay();
    const currentStreaks = loadStreaks();

    const saved = loadDailyState();
    if (saved) {
      setState({
        solution: daily,
        guesses: saved.guesses,
        evaluations: saved.evaluations,
        keyboardColors: saved.keyboardColors,
        currentGuess: "",
        currentRow: saved.guesses.length,
        gameStatus: saved.gameStatus,
        toastMessage:
          saved.gameStatus === "won"
            ? "Ya ganaste la palabra del dia!"
            : saved.gameStatus === "lost"
              ? `Ya jugaste hoy. Era: ${daily}`
              : "",
        revealingRow: null,
        gameMode: "daily",
        streaks: currentStreaks,
      });
    } else {
      setState({
        solution: daily,
        guesses: [],
        evaluations: [],
        currentGuess: "",
        currentRow: 0,
        gameStatus: "playing",
        toastMessage: "",
        keyboardColors: {},
        revealingRow: null,
        gameMode: "daily",
        streaks: currentStreaks,
      });
    }
  }, []);

  const getCompetitiveCups = useCallback((): number => {
    return competitiveCups;
  }, [competitiveCups]);

  const multiplayerMode = useCallback(() => {
    const currentStreaks = loadStreaks();
    setState({
      solution: "",
      guesses: [],
      evaluations: [],
      currentGuess: "",
      currentRow: 0,
      gameStatus: "playing",
      toastMessage: "",
      keyboardColors: {},
      revealingRow: null,
      gameMode: "multiplayer",
      streaks: currentStreaks,
    });
  }, [])


  const revealSubsRef = useRef<
    Set<(info: {
      rowIndex: number;
      evaluation: LetterState[];
      guess: string;
      solution: string;
      wasSolved: boolean;
      exhausted: boolean;
      wordFinished: boolean;
    }) => void>
  >(new Set());

  const onRevealComplete = useCallback((cb: (info: {
    rowIndex: number;
    evaluation: LetterState[];
    guess: string;
    solution: string;
    wasSolved: boolean;
    exhausted: boolean;
    wordFinished: boolean;
  }) => void) => {
    revealSubsRef.current.add(cb);
    return () => {
      revealSubsRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKeyPress("BACKSPACE");
      } else {
        const letter = e.key.toUpperCase();
        if (/^[A-ZÑ]$/.test(letter)) {
          handleKeyPress(letter);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  return {
    ...state,
    handleKeyPress,
    resetGame,
    startSolitaire,
    startDailyGame,
    finishReveal,
    multiplayerMode,
    onRevealComplete,
    startMultiplayerRound,
    getCompetitiveCups
  };
}
