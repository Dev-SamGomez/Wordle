"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WORDS } from "@/data/words";
import { evaluateGuess, type LetterState } from "@/utils/evaluateWord";

export type { LetterState };
export type Evaluation = LetterState;
export type GameStatus = "playing" | "won" | "lost";
export type KeyboardColors = Record<string, LetterState>;
export type GameMode = "solitaire" | "daily";

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
}

const uniqueWords = [...new Set(WORDS.map((w) => w.toUpperCase()))];

// --- Palabra del dia ---
const a = 157;
const b = 263;
const p = 10000019;

function wordDay(): string {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const D = dia * 1000000 + mes * 10000 + anio;
  const hash = ((a * D + b) % p) % uniqueWords.length;
  return uniqueWords[hash];
}

function getTodayKey(): string {
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

function loadDailyState(): DailyState | null {
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

function saveDailyState(state: DailyState) {
  localStorage.setItem("wordle-daily", JSON.stringify(state));
}

// --- Random word helper ---
function getRandomWord(usedWords: Set<string>): string {
  const available = uniqueWords.filter((w) => !usedWords.has(w));
  if (available.length === 0) {
    return uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function useGame() {
  const usedWordsRef = useRef<Set<string>>(new Set());

  const [state, setState] = useState<GameState>(() => {
    const word = getRandomWord(usedWordsRef.current);
    usedWordsRef.current.add(word);
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
    };
  });

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

          // Persist daily state
          if (prev.gameMode === "daily") {
            const isWin = evaluation.every((s) => s === "correct");
            const isLoss = !isWin && newGuesses.length >= 6;
            const newStatus: GameStatus = isWin
              ? "won"
              : isLoss
                ? "lost"
                : "playing";

            saveDailyState({
              date: getTodayKey(),
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
          return {
            ...prev,
            currentGuess: prev.currentGuess.slice(0, -1),
          };
        }

        if (prev.currentGuess.length >= 5) return prev;
        if (/^[A-ZÑ]$/.test(key)) {
          return {
            ...prev,
            currentGuess: prev.currentGuess + key,
          };
        }

        return prev;
      });
    },
    [updateKeyboardColors]
  );

  const finishReveal = useCallback(() => {
    setState((prev) => {
      const lastEvaluation = prev.evaluations[prev.evaluations.length - 1];

      if (!lastEvaluation) {
        return { ...prev, revealingRow: null };
      }

      const isWin = lastEvaluation.every((s) => s === "correct");
      const isLoss = !isWin && prev.guesses.length >= 6;

      return {
        ...prev,
        revealingRow: null,
        gameStatus: isWin ? "won" : isLoss ? "lost" : "playing",
        toastMessage: isWin
          ? "Ganaste!"
          : isLoss
            ? `Perdiste, Era: ${prev.solution}`
            : "",
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    const word = getRandomWord(usedWordsRef.current);
    usedWordsRef.current.add(word);
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
    });
  }, []);

  const startDailyGame = useCallback(() => {
    const daily = wordDay();

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
      });
    }
  }, []);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    startDailyGame,
    finishReveal,
  };
}
