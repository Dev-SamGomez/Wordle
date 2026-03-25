
interface RoundDotsProps {
    results: ("win" | "loss" | null)[];
    totalRounds: number;
    className?: string;
    "aria-label"?: string;
}

const RoundDots = ({
    results,
    totalRounds,
    className,
    "aria-label": ariaLabel,
}: RoundDotsProps) => {
    return (
        <div className={`flex items-center justify-center gap-2.5 ${className ?? ""}`} aria-label={ariaLabel}>
            {Array.from({ length: totalRounds }).map((_, i) => {
                const r = results[i];
                let bg: string;
                let border: string;

                if (r === null) {
                    bg = "transparent";
                    border = "#3a3a3c";
                } else if (r === "win") {
                    bg = "#538d4e";
                    border = "#538d4e";
                } else {
                    bg = "transparent";
                    border = "#b91c1c";
                }

                return (
                    <span
                        key={i}
                        className="inline-block h-3.5 w-3.5 rounded-full border-2 transition-all duration-300"
                        style={{ backgroundColor: bg, borderColor: border }}
                        aria-hidden="true"
                    />
                );
            })}
        </div>
    );
}

export default RoundDots;