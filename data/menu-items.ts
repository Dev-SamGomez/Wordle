export type MenuAction =
    | "inicio"
    | "tutorial"
    | "word-of-day"
    | "solitaire"
    | "multiplayer"
    | "competitive-record"
    | "leader-board";

export interface MenuItem {
    label: string;
    action?: MenuAction;
    children?: MenuItem[];
}