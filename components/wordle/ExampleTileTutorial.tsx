const ExampleTile = ({
    letter,
    variant,
}: {
    letter: string;
    variant: "correct" | "present" | "absent" | "default";
}) => {
    const colors = {
        correct: "bg-[#538d4e] border-[#538d4e] text-white",
        present: "bg-[#b59f3b] border-[#b59f3b] text-white",
        absent: "bg-[#3a3a3c] border-[#3a3a3c] text-white",
        default: "border-[#565758] text-white",
    };

    return (
        <div
            className={`w-10 h-10 flex items-center justify-center text-lg font-bold uppercase border-2 ${colors[variant]}`}
        >
            {letter}
        </div>
    );
}

export default ExampleTile