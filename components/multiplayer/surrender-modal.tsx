import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5";

interface DrawModalProps {
    handleAcceptSurrender: () => void
    handleRejectSurrender: () => void
}

const SurrenderModal = ({ handleAcceptSurrender, handleRejectSurrender }: DrawModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[min(92vw,380px)] rounded-lg border border-border bg-background p-4 shadow-xl">
                <div className="text-sm text-foreground font-semibold mb-1">
                    Rendirse
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                    ¿Estas seguro de que deseas rendirte?
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={handleRejectSurrender}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-muted hover:bg-muted/80"
                        aria-label="No rendirse"
                        title="No rendirse"
                    >
                        <IoCloseSharp />
                    </button>
                    <button
                        onClick={handleAcceptSurrender}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-foreground hover:opacity-90"
                        aria-label="Rendirse"
                        title="Rendirse"
                    >
                        <IoCheckmarkSharp />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SurrenderModal;