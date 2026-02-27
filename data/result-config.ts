import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export const resultConfig = {
    win: { label: "Victoria", color: "text-[#538d4e]", bg: "bg-[#538d4e]/10", border: "border-[#538d4e]/30", icon: ArrowUp },
    lose: { label: "Derrota", color: "text-[#d32f2f]", bg: "bg-[#d32f2f]/10", border: "border-[#d32f2f]/30", icon: ArrowDown },
    draw: { label: "Empate", color: "text-[#b59f3b]", bg: "bg-[#b59f3b]/10", border: "border-[#b59f3b]/30", icon: Minus },
};