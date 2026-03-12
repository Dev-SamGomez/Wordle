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
import { menuItems } from "@/data/menu-schema";
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
    onConfig: () => void;
    cups: number;
    streakDaily: number;
    streakSolitarie: number;
}

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
    onConfig,
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
            case "config":
                onConfig();
                onOpenChange(false);
                break;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="bg-card border-border w-72 sm:max-w-xs p-0"
            >
                <SheetHeader className="border-b border-border px-5 py-4">
                    <SheetTitle className="text-foreground text-lg tracking-widest">
                        WORDLE
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col py-2">
                    {menuItems.map((item) => {
                        if (!item.children) {
                            return (
                                <button
                                    key={item.action}
                                    onClick={() => handleAction(item.action!)}
                                    className="flex items-center justify-between gap-3 px-5 py-3.5 text-foreground hover:bg-muted/50 transition-colors text-left"
                                >
                                    <span className="text-sm font-medium">{item.label}</span>

                                    {item.action === "word-of-day" && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
                                            <Flame className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                                            <span className="text-[11px] font-semibold text-foreground tabular-nums">
                                                {formatCups(streakDaily)}
                                            </span>
                                        </span>
                                    )}

                                    {item.action === "solitaire" && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
                                            <Flame className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                                            <span className="text-[11px] font-semibold text-foreground tabular-nums">
                                                {formatCups(streakSolitarie)}
                                            </span>
                                        </span>
                                    )}
                                </button>
                            );
                        }

                        return (
                            <div key={item.label} className="px-3">
                                <Accordion type="single" collapsible>
                                    <AccordionItem value={item.label} className="border-b-0">
                                        <AccordionTrigger className="px-2 py-3.5 text-foreground hover:no-underline hover:bg-muted/50 rounded-md transition-colors">
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-0 pl-3">
                                            <div className="flex flex-col gap-0.5">
                                                {item.children.map((child) => (
                                                    <button
                                                        key={child.action}
                                                        onClick={() => handleAction(child.action!)}
                                                        className="flex items-center justify-between gap-3 px-2 py-3 text-foreground hover:bg-muted/50 rounded-md transition-colors text-left"
                                                    >
                                                        <span className="text-sm">{child.label}</span>

                                                        {child.action === "multiplayer" && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
                                                                <Trophy className="h-3.5 w-3.5 text-[hsl(var(--tile-present))]" />
                                                                <span className="text-[11px] font-semibold text-foreground tabular-nums">
                                                                    {formatCups(cups)}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        );
                    })}
                </nav>

            </SheetContent>
        </Sheet>
    );
}
