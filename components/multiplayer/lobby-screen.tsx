import { useMultiplayer } from "@/hooks/use-multiplayergame";
import { LogIn, Plus, Trophy, Users, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiChessdotcom } from "react-icons/si";
import FriendsPanel from "../wordle/FriendPanel";

export const LobbyScreen = ({ game, namePlayer }: { game: ReturnType<typeof useMultiplayer>; namePlayer: string }) => {
    const [name, setName] = useState(namePlayer);
    const [roomInput, setRoomInput] = useState("");
    const [activeTab, setActiveTab] = useState<"matchmaking" | "manual" | "friends">("matchmaking");

    const canCancelFind = useMemo(
        () => game.gameStatus === "queueing",
        [game.gameStatus]
    );

    const canCreate = useMemo(
        () => game.gameStatus !== "countdown" && game.gameStatus !== "playing",
        [game.gameStatus]
    );

    const canJoin = useMemo(
        () => !!roomInput.trim() && game.gameStatus !== "countdown" && game.gameStatus !== "playing",
        [roomInput, game.gameStatus]
    );

    const isQueueing = game.gameStatus === "queueing";

    const handleFindMatch = () => {
        game.findMatch(name);
    };

    const handleCancelFind = () => {
        game.cancelFind();
    };

    return (
        <div className="flex min-h-screen items-center bg-background">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/15 ring-1 ring-[#538d4e]/30">
                        <SiChessdotcom className="h-8 w-8 text-[#538d4e]" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Modo Competitivo
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Juega contra otro jugador: busca partida o crea/únete con un código
                    </p>

                    <div className="pt-5 flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 text-base font-bold text-foreground tabular-nums">
                            <Trophy className="h-4 w-4 text-[#c9b458]" />
                            {game.getCompetitiveCups()}
                        </span>

                        {typeof game.competitive.lastMatchDelta === "number" && (
                            <span
                                className={`text-xs font-semibold ${game.competitive.lastMatchDelta > 0
                                    ? "text-[#538d4e]"
                                    : game.competitive.lastMatchDelta < 0
                                        ? "text-[#b91c1c]"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                {game.competitive.lastMatchDelta > 0
                                    ? `+${game.competitive.lastMatchDelta}`
                                    : game.competitive.lastMatchDelta}{" "}
                                copas
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted p-6 shadow-xl shadow-black/30">

                    <div className="mb-5 flex gap-1 rounded-xl bg-background p-1">
                        <button
                            onClick={() => setActiveTab("matchmaking")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "matchmaking"
                                ? "bg-[#538d4e] text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Search className="h-4 w-4" />
                            Online
                        </button>
                        <button
                            onClick={() => setActiveTab("manual")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "manual"
                                ? "bg-[#538d4e] text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Plus className="h-4 w-4" />
                            Crear/Unirse
                        </button>
                        <button
                            onClick={() => setActiveTab("friends")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "friends"
                                ? "bg-[#538d4e] text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Amigos
                        </button>
                    </div>

                    {activeTab === "matchmaking" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Te emparejaremos automáticamente con el siguiente jugador disponible.
                            </p>

                            {isQueueing && (
                                <div className="rounded-lg border border-border bg-muted p-4">
                                    <p className="text-sm text-foreground font-medium">
                                        Buscando partida…
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        La partida comenzara al encontrar a un jugador disponible.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleFindMatch}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <Search className="h-4 w-4" />
                                    Buscar partida
                                </button>

                                <button
                                    onClick={handleCancelFind}
                                    disabled={!canCancelFind}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#b91c1c] px-4 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab == "manual" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Crea una partida y comparte el código con tu rival para empezar.
                                </p>
                                <button
                                    onClick={() => game.createRoom(name)}
                                    disabled={!canCreate}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear nueva partida
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label
                                        htmlFor="room-id"
                                        className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                                    >
                                        Código de partida
                                    </label>
                                    <input
                                        id="room-id"
                                        type="text"
                                        placeholder="Pega el código aquí..."
                                        value={roomInput}
                                        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#538d4e] focus:ring-2 focus:ring-[#538d4e]/20"
                                    />
                                </div>
                                <button
                                    onClick={() => game.joinRoom(roomInput, name)}
                                    disabled={!canJoin}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Unirse a la partida
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === "friends" && (
                        <FriendsPanel game={game} />
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Ambos jugadores deben estar conectados para iniciar.
                </p>
            </div>
        </div>
    );
};

export default LobbyScreen;
