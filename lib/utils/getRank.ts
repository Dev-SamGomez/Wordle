import { RANKS } from "@/data/ranks";

export const getRankInfo = (cups: number): { label: string; color: string } => {
    if (cups >= 3000) return { label: "Maestro", color: "#b59f3b" };
    if (cups >= 2000) return { label: "Diamante", color: "#60a5fa" };
    if (cups >= 1500) return { label: "Oro", color: "#fbbf24" };
    if (cups >= 500) return { label: "Plata", color: "#9ca3af" };
    return { label: "Bronce", color: "#cd7f32" };
}

export const getRank = (cups: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (cups >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[0];
}