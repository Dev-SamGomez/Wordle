import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export const resultConfig = {
    win: { label: "Victoria", color: "text-[hsl(var(--tile-correct))]", bg: "bg-[hsl(var(--tile-correct))]/10", border: "border-[hsl(var(--tile-correct))]/30", icon: ArrowUp },
    lose: { label: "Derrota", color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive))]/10", border: "border-[hsl(var(--destructive))]/30", icon: ArrowDown },
    draw: { label: "Empate", color: "text-[hsl(var(--tile-present))]", bg: "bg-[hsl(var(--tile-present))]/10", border: "border-[hsl(var(--tile-present))]/30", icon: Minus },
};