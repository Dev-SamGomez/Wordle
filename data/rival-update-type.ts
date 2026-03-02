import { LetterState } from "@/utils/evaluateWord";

export type RivalUpdate = {
    solvedCount: number;
    currentWordIndex: number;
    evaluation: LetterState[];
    wordFinished?: boolean;
    wasSolved?: boolean;
    wordIndex?: number;
};