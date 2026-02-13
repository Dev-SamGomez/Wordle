"use client";

import { type LetterState } from "@/utils/evaluateWord";

interface TileProps {
  letter: string;
  state?: LetterState;
  isRevealing?: boolean;
  revealDelay?: number;
  isCurrentRow?: boolean;
}

const stateColors: Record<LetterState, string> = {
  correct: "bg-[#538d4e] border-[#538d4e]",
  present: "bg-[#b59f3b] border-[#b59f3b]",
  absent: "bg-[#3a3a3c] border-[#3a3a3c]",
};

export function Tile({
  letter,
  state,
  isRevealing = false,
  revealDelay = 0,
  isCurrentRow = false,
}: TileProps) {
  const hasLetter = letter !== "";
  const isEvaluated = state !== undefined;

  const baseClasses =
    "w-[clamp(48px,13vw,62px)] h-[clamp(48px,13vw,62px)] flex items-center justify-center text-[clamp(1.25rem,4vw,1.875rem)] font-bold uppercase select-none border-2";

  let colorClasses: string;
  if (isEvaluated) {
    colorClasses = `${stateColors[state]} text-white`;
  } else if (hasLetter) {
    colorClasses = "border-[#565758] bg-transparent text-white";
  } else {
    colorClasses = "border-[#3a3a3c] bg-transparent text-white";
  }

  const popClass = isCurrentRow && hasLetter && !isEvaluated ? "animate-pop" : "";

  const revealClass = isRevealing ? "animate-flip" : "";

  return (
    <div
      className={`${baseClasses} ${colorClasses} ${popClass} ${revealClass}`}
      style={{
        animationDelay: isRevealing ? `${revealDelay}ms` : undefined,
        animationFillMode: isRevealing ? "both" : undefined,
      }}
    >
      {letter}
    </div>
  );
}
