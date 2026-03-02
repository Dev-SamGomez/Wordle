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
  correct:
    "bg-[hsl(var(--tile-correct))] border-[hsl(var(--tile-correct))] text-white",
  present:
    "bg-[hsl(var(--tile-present))] border-[hsl(var(--tile-present))] text-white",
  absent:
    "bg-[hsl(var(--tile-absent))] border-[hsl(var(--tile-absent))] text-foreground",
};

export function Tile({
  letter,
  state,
  isRevealing = false,
  revealDelay = 0,
  isCurrentRow = false,
}: TileProps) {
  const hasLetter = letter !== "";

  const alreadyEvaluated = !isRevealing && state !== undefined;

  const baseClasses =
    "w-[clamp(48px,13vw,62px)] h-[clamp(48px,13vw,62px)] flex items-center justify-center text-[clamp(1.25rem,4vw,1.875rem)] font-bold uppercase select-none border-2";

  const frontColor = hasLetter
    ? "border-[hsl(var(--tile-border-active))] bg-transparent text-foreground"
    : "border-[hsl(var(--tile-border))] bg-transparent text-foreground";

  const backColor =
    state !== undefined
      ? stateColors[state]
      : "border-[hsl(var(--tile-border))] bg-transparent text-foreground";

  const popClass = isCurrentRow && hasLetter && !state ? "animate-pop" : "";

  if (alreadyEvaluated) {
    return (
      <div className={`${baseClasses} ${backColor}`}>
        {letter}
      </div>
    );
  }

  if (isRevealing) {
    return (
      <div
        className="tile-flip-container"
        style={{
          width: "clamp(48px, 13vw, 62px)",
          height: "clamp(48px, 13vw, 62px)",
          perspective: "300px",
        }}
      >
        <div
          className="tile-flip-inner"
          style={{
            animationDelay: `${revealDelay}ms`,
          }}
        >
          <div className={`tile-face tile-front ${baseClasses} ${frontColor}`}>
            {letter}
          </div>
          <div className={`tile-face tile-back ${baseClasses} ${backColor}`}>
            {letter}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${frontColor} ${popClass}`}>
      {letter}
    </div>
  );
}
