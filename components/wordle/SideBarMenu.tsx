"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { formatCups } from "@/utils/competitive";
import { Flame, Trophy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
interface SidebarMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onShowMain: () => void;
    onTutorial: () => void;
    onDailyWord: () => void;
    onSolitaire: () => void;
    onMultiplayer: () => void;
    onCompetitiveRecord: () => void;
    onLeaderBoard: () => void;
    cups: number;
    streakDaily: number;
    streakSolitarie: number;
}

const menuItems = [
    {
        label: "Inicio",
        action: "inicio" as const,
    },
    {
        label: "Tutorial",
        action: "tutorial" as const,
    },
    {
        label: "Palabra del dia",
        action: "word-of-day" as const,
    },
    {
        label: "Solitario",
        action: "solitaire" as const,
    },
    {
        label: "Competitivo",
        action: "multiplayer" as const,
    },
];

export default function SidebarMenu({
    open,
    onOpenChange,
    onShowMain,
    onTutorial,
    onDailyWord,
    onSolitaire,
    onMultiplayer,
    onCompetitiveRecord,
    onLeaderBoard,
    cups,
    streakDaily,
    streakSolitarie
}: SidebarMenuProps) {

    const handleAction = (action: string) => {
        switch (action) {
            case "inicio":
                onShowMain();
                onOpenChange(false);
                break;
            case "tutorial":
                onTutorial();
                onOpenChange(false);
                break;
            case "word-of-day":
                onDailyWord();
                onOpenChange(false);
                break;
            case "solitaire":
                onSolitaire();
                onOpenChange(false);
                break;
            case "multiplayer":
                onMultiplayer();
                onOpenChange(false);
                break;
            case "competitive-record":
                onCompetitiveRecord();
                onOpenChange(false);
                break;
            case "leader-board":
                onLeaderBoard();
                onOpenChange(false);
                break;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="bg-[#121213] border-[#3a3a3c] w-72 sm:max-w-xs p-0"
            >
                <SheetHeader className="border-b border-[#3a3a3c] px-5 py-4">
                    <SheetTitle className="text-white text-lg tracking-widest">
                        WORDLE
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col py-2">
                    {menuItems.filter(x => x.label !== "Competitivo").map((item) => (
                        <button
                            key={item.action}
                            onClick={() => handleAction(item.action)}
                            className="flex items-center justify-between gap-3 px-5 py-3.5 text-[#d7dadc] hover:bg-[#3a3a3c]/50 transition-colors text-left"
                        >
                            <span className="text-sm font-medium">{item.label}</span>

                            {item.action === "word-of-day" && (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3c] bg-[#2a2a2c] px-2 py-0.5"
                                    title={`${streakDaily} racha`}
                                >
                                    <Flame className="h-3.5 w-3.5 text-[#ac461d]" />
                                    <span className="text-[11px] font-semibold text-[#e5e5e7] tabular-nums">
                                        {formatCups(streakDaily)}
                                    </span>
                                </span>
                            )}

                            {item.action === "solitaire" && (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3c] bg-[#2a2a2c] px-2 py-0.5"
                                    title={`${streakSolitarie} racha`}
                                >
                                    <Flame className="h-3.5 w-3.5 text-[#ac461d]" />
                                    <span className="text-[11px] font-semibold text-[#e5e5e7] tabular-nums">
                                        {formatCups(streakSolitarie)}
                                    </span>
                                </span>
                            )}

                        </button>
                    ))}

                    <div className="px-3">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="competitive" className="border-b-0">
                                <AccordionTrigger className="px-2 py-3.5 text-[#d7dadc] hover:no-underline hover:bg-[#3a3a3c]/50 rounded-md transition-colors [&[data-state=open]]:bg-[#3a3a3c]/30">
                                    <span className="flex items-center gap-3">
                                        <span className="text-sm font-medium">Competitivo</span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0 pl-3">
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => handleAction("multiplayer")}
                                            className="flex items-center justify-between gap-3 px-2 py-3 text-[#d7dadc] hover:bg-[#3a3a3c]/50 rounded-md transition-colors text-left"
                                        >
                                            <span className="text-sm">Competitivo</span>
                                            <span
                                                className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3c] bg-[#2a2a2c] px-2 py-0.5"
                                                title={`${cups} copas`}
                                            >
                                                <Trophy className="h-3.5 w-3.5 text-[#c9b458]" />
                                                <span className="text-[11px] font-semibold text-[#e5e5e7] tabular-nums">
                                                    {formatCups(cups)}
                                                </span>
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleAction("competitive-record")}
                                            className="flex items-center gap-3 px-2 py-3 text-[#d7dadc] hover:bg-[#3a3a3c]/50 rounded-md transition-colors text-left"
                                        >
                                            <span className="text-sm">Historial Competitivo</span>
                                        </button>
                                        <button
                                            onClick={() => handleAction("leader-board")}
                                            className="flex items-center gap-3 px-2 py-3 text-[#d7dadc] hover:bg-[#3a3a3c]/50 rounded-md transition-colors text-left"
                                        >
                                            <span className="text-sm">Top mejores jugadores</span>
                                        </button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                </nav>

            </SheetContent>
        </Sheet>
    );
}
