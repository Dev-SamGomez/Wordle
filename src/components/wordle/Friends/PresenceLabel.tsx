const PresenceLabel = ({ state }: { state?: string }) => {
    const labels: Record<string, { text: string; color: string }> = {
        online: { text: "En linea", color: "text-emerald-400" },
        playing: { text: "Jugando", color: "text-purple-400" },
        busy: { text: "Ocupado", color: "text-amber-400" },
        offline: { text: "Desconectado", color: "text-slate-500" },
    };
    const { text, color } = labels[state as keyof typeof labels] || labels.offline;
    return <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{text}</span>;
};

export default PresenceLabel