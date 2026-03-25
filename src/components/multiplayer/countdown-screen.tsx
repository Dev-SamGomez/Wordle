interface CountdownScreenProps {
    countdown: number
    myName: string
    opponentName: string
}

const CountdownScreen = ({ countdown, myName, opponentName }: CountdownScreenProps) => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-background/15 ring-1 ring-[#538d4e]/30">
                    <span className="text-4xl font-bold text-[#538d4e]">
                        {countdown}
                    </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Preparados!
                </h2>

                <p className="mt-2 text-sm text-foreground font-semibold">
                    {(myName || "Tú")} <span className="text-muted-foreground">vs</span> {opponentName || "Rival"}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                    La partida comienza en {countdown}...
                </p>
            </div>
        </div>
    );
}

export default CountdownScreen;