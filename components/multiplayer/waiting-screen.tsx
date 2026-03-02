import { copyGameCode } from "@/utils/copyGameCode";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";

const WaitingScreen = ({ roomId }: { roomId: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copyGameCode(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center">
                <div className="rounded-2xl border border-border bg-muted p-8 shadow-xl shadow-black/30">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted/15 ring-1 ring-[#538d4e]/30">
                        <Loader2 className="h-7 w-7 animate-spin text-[#538d4e]" />
                    </div>

                    <h2 className="text-xl font-bold text-foreground">
                        Esperando rival...
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Comparte este codigo para que tu rival se una
                    </p>

                    <button
                        onClick={handleCopy}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-mono font-semibold text-muted-foreground transition-all hover:border-border/40 hover:bg-muted active:scale-[0.98]"
                    >
                        <span className="tracking-widest">{roomId}</span>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {copied && (
                        <p className="mt-3 text-xs font-medium text-[#538d4e]">
                            Copiado al portapapeles
                        </p>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#538d4e] opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#538d4e]" />
                        </span>
                        <span className="text-xs text-muted-foreground">Sala activa</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WaitingScreen;