import { useMultiplayer } from "@/hooks/use-multiplayergame";

let instance: ReturnType<typeof useMultiplayer> | null = null;

export function setMultiplayerInstance(v: ReturnType<typeof useMultiplayer>) {
    instance = v;
}

export function getMultiplayerInstance() {
    if (!instance) throw new Error("Multiplayer instance not initialized");
    return instance;
}