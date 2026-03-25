const PresenceRing = ({ state, children }: { state?: string; children: React.ReactNode }) => {
    const ringColors: Record<string, string> = {
        online: "ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
        playing: "ring-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]",
        busy: "ring-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
        offline: "ring-slate-600",
    };
    const isActive = state === "online" || state === "playing";
    return (
        <div className={`relative rounded-full ring-2 ${ringColors[state as keyof typeof ringColors] || ringColors.offline} ${isActive ? "animate-pulse" : ""}`}>
            {children}
            {isActive && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state === "online" ? "bg-emerald-400" : "bg-purple-400"}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${state === "online" ? "bg-emerald-500" : "bg-purple-500"}`} />
                </span>
            )}
        </div>
    );
};

export default PresenceRing;