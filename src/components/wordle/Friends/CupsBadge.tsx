import { Trophy } from "lucide-react";

const CupsBadge = ({ cups }: { cups: number }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
        <span className="text-sm font-black tabular-nums text-amber-400">{cups}</span>
    </div>
);

export default CupsBadge