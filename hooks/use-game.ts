"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WORDS } from "@/data/words";
import { evaluateGuess, type LetterState } from "@/utils/evaluateWord";

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  solution: string;
  guesses: string[];
  evaluations: LetterState[][];
  currentGuess: string;
  currentRow: number;
  gameStatus: GameStatus;
  toastMessage: string;
  keyboardColors: Record<string, LetterState>;
  revealingRow: number | null;
}

const uniqueWords = [...new Set(WORDS.map((w) => w.toUpperCase()))];

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
    };
  });

  const clearToast = useCallback(() => {
    setState((prev) => ({ ...prev, toastMessage: "" }));
  }, []);

  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(clearToast, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, clearToast]);

  const updateKeyboardColors = useCallback(
    (
      currentColors: Record<string, LetterState>,
      guess: string,
      evaluation: LetterState[]
    ): Record<string, LetterState> => {
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

        if (
          !currentState ||
          priority[newState] > priority[currentState]
        ) {
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

          return {
            ...prev,
            guesses: newGuesses,
            evaluations: newEvaluations,
            currentGuess: "",
            currentRow: prev.currentRow + 1,
            gameStatus: isWin ? "won" : isLoss ? "lost" : "playing",
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
    setState((prev) => ({ ...prev, revealingRow: null }));
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
    });
  }, []);

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
    finishReveal,
  };
}
