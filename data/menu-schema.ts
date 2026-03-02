import { MenuItem } from "./menu-items";

export const menuItems: MenuItem[] = [
    { label: "Inicio", action: "inicio" },
    { label: "Tutorial", action: "tutorial" },
    { label: "Palabra del dia", action: "word-of-day" },
    { label: "Solitario", action: "solitaire" },
    {
        label: "Competitivo",
        children: [
            { label: "Competitivo", action: "multiplayer" },
            { label: "Historial Competitivo", action: "competitive-record" },
            { label: "Top mejores jugadores", action: "leader-board" },
        ],
    },
    { label: "Configuracion", action: "config" }
];