import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5";

interface DrawModalProps {
    opponentName?: string
    handleAcceptDraw: () => void
    handleRejectDraw: () => void
}

const DrawModal = ({ handleAcceptDraw, handleRejectDraw, opponentName }: DrawModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[min(92vw,380px)] rounded-lg border border-border bg-background p-4 shadow-xl">
                <div className="text-sm text-foreground font-semibold mb-1">
                    {opponentName ?? "Tu rival"} propone empate
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                    ¿Aceptar tablas y terminar la partida en empate?
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={handleRejectDraw}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-muted hover:bg-muted/80"
                        aria-label="Rechazar empate"
                        title="Rechazar"
                    >
                        <IoCloseSharp />
                    </button>
                    <button
                        onClick={handleAcceptDraw}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:opacity-90"
                        aria-label="Aceptar empate"
                        title="Aceptar"
                    >
                        <IoCheckmarkSharp />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DrawModal;