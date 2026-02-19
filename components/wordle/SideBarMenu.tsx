"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface SidebarMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTutorial: () => void;
}

const menuItems = [
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
];

export default function SidebarMenu({
    open,
    onOpenChange,
    onTutorial,
}: SidebarMenuProps) {
    const handleAction = (action: string) => {
        switch (action) {
            case "tutorial":
                onTutorial();
                onOpenChange(false);
                break;
            case "word-of-day":
                onOpenChange(false);
                break;
            case "solitaire":
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
                    {menuItems.map((item) => (
                        <button
                            key={item.action}
                            onClick={() => handleAction(item.action)}
                            className="flex items-center gap-3 px-5 py-3.5 text-[#d7dadc] hover:bg-[#3a3a3c]/50 transition-colors text-left"
                        >
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
