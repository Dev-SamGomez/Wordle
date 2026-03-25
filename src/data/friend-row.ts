import { PresenceState } from "./presence-state";

export type FriendRow = {
    uid: string;
    nickname: string;
    nicknameLower?: string;
    cups: number;
    trend: "up" | "down" | "flat";
    photoURL?: string | null;
    presence?: PresenceState;
};