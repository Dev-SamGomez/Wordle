export type LetterState = "correct" | "present" | "absent";

export function evaluateGuess(guess: string, solution: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const solutionChars = solution.split("");
  const guessChars = guess.split("");

  const used: boolean[] = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === solutionChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;

    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessChars[i] === solutionChars[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}
