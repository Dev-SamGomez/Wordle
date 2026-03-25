import { FriendRow } from "@/src/lib/data/friend-row";
import PresenceRing from "./PresenceRing";
import TrendBadge from "./TrendBadge";
import PresenceLabel from "./PresenceLabel";
import CupsBadge from "./CupsBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import { Swords, History, X } from "lucide-react";

type FriendCardProps = {
    fr: FriendRow;
    pendingIncomingFrom: Map<string, any>;
    pendingOutgoingTo: Set<string>;
    handleAcceptChallenge: (id: string) => void;
    handleRejectChallenge: (id: string) => void;
    handleChallenge: (uid: string) => void;
    setUid: (uid: string | null) => void;
    setShowHistoryCompetitive: (show: boolean) => void;
};

const FriendCard = ({ fr, pendingIncomingFrom, pendingOutgoingTo, handleAcceptChallenge, handleRejectChallenge, handleChallenge, setUid, setShowHistoryCompetitive }: FriendCardProps) => {
    const incoming = pendingIncomingFrom.get(fr.uid);
    const isOutgoingPending = pendingOutgoingTo.has(fr.uid);
    const isOnline = fr.presence === "online" || fr.presence === "playing";

    return (
        <div className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${isOnline
            ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10"
            : "bg-secondary/30 border-border hover:border-border hover:bg-secondary/50"
            }`}>
            <PresenceRing state={fr.presence}>
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center font-bold text-lg overflow-hidden">
                    {fr.photoURL ? (
                        <img src={fr.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-muted-foreground">{fr.nickname.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </PresenceRing>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{fr.nickname}</p>
                    <TrendBadge trend={fr.trend} />
                </div>
                <PresenceLabel state={fr.presence} />
            </div>

            <CupsBadge cups={fr.cups} />

            <div className="flex gap-1.5 ml-1">
                {incoming ? (
                    <div className="flex items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleAcceptChallenge(incoming.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95"
                                >
                                    <Swords className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Aceptar desafio</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleRejectChallenge(incoming.id)}
                                    className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl transition-all shadow-lg shadow-rose-900/30 hover:scale-105 active:scale-95"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Rechazar desafio</TooltipContent>
                        </Tooltip>
                    </div>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => handleChallenge(fr.uid)}
                                disabled={isOutgoingPending}
                                className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${isOutgoingPending
                                    ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                                    : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                                    }`}
                            >
                                <Swords className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{isOutgoingPending ? "Desafio pendiente" : "Desafiar"}</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => { setUid(fr.uid); setShowHistoryCompetitive(true); }}
                            className="bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <History className="w-4 h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Ver historial</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
};

export default FriendCard