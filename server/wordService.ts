import { WORDS } from "../data/words";

const uniqueWords = [...new Set(WORDS.map(w => w.toUpperCase()))];

export function getThreeRandomWords(): string[] {
    const shuffled = [...uniqueWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}