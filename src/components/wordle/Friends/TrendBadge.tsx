import { Minus, TrendingDown, TrendingUp } from "lucide-react";

const TrendBadge = ({ trend }: { trend: "up" | "down" | "flat" }) => {
    const config = {
        up: { icon: TrendingUp, bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
        down: { icon: TrendingDown, bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
        flat: { icon: Minus, bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
    };
    const { icon: Icon, bg, text, border } = config[trend];
    return (
        <div className={`flex items-center justify-center w-6 h-6 rounded-md ${bg} border ${border}`}>
            <Icon className={`w-3.5 h-3.5 ${text}`} />
        </div>
    );
};

export default TrendBadge