import { useMultiplayer } from "@/hooks/use-multiplayergame";
import { LogIn, Plus, Trophy, Users, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiChessdotcom } from "react-icons/si";

export const LobbyScreen = ({ game }: { game: ReturnType<typeof useMultiplayer> }) => {
    const [name, setName] = useState("");
    const [roomInput, setRoomInput] = useState("");
    const [activeTab, setActiveTab] = useState<"matchmaking" | "manual">("matchmaking");

    const canFindMatch = useMemo(
        () => !!name.trim() && game.gameStatus !== "queueing" && game.gameStatus !== "countdown" && game.gameStatus !== "playing",
        [name, game.gameStatus]
    );

    const canCancelFind = useMemo(
        () => game.gameStatus === "queueing",
        [game.gameStatus]
    );

    const canCreate = useMemo(
        () => !!name.trim() && game.gameStatus !== "countdown" && game.gameStatus !== "playing",
        [name, game.gameStatus]
    );

    const canJoin = useMemo(
        () => !!name.trim() && !!roomInput.trim() && game.gameStatus !== "countdown" && game.gameStatus !== "playing",
        [name, roomInput, game.gameStatus]
    );

    const isQueueing = game.gameStatus === "queueing";

    const handleFindMatch = () => {
        game.findMatch(name);
    };

    const handleCancelFind = () => {
        game.cancelFind();
    };

    return (
        <div className="flex min-h-screen items-center bg-[#121213]">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#538d4e]/15 ring-1 ring-[#538d4e]/30">
                        <SiChessdotcom className="h-8 w-8 text-[#538d4e]" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Modo Competitivo
                    </h1>
                    <p className="mt-2 text-sm text-[#818184]">
                        Juega contra otro jugador: busca partida o crea/únete con un código
                    </p>

                    <div className="pt-5 flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1 text-base font-bold text-white tabular-nums">
                            <Trophy className="h-4 w-4 text-[#c9b458]" />
                            {game.competitive.cups}
                        </span>

                        {typeof game.competitive.lastMatchDelta === "number" && (
                            <span
                                className={`text-xs font-semibold ${game.competitive.lastMatchDelta > 0
                                        ? "text-[#538d4e]"
                                        : game.competitive.lastMatchDelta < 0
                                            ? "text-[#b91c1c]"
                                            : "text-[#818184]"
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

                <div className="rounded-2xl border border-[#3a3a3c] bg-[#1a1a1b] p-6 shadow-xl shadow-black/30">
                    <div className="mb-6">
                        <label
                            htmlFor="player-name"
                            className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#818184]"
                        >
                            Tu nombre
                        </label>
                        <div className="relative">
                            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#818184]" />
                            <input
                                id="player-name"
                                type="text"
                                placeholder="Ingresa tu nombre..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-[#3a3a3c] bg-[#2a2a2c] px-4 py-3 pl-10 text-sm text-[#e5e5e7] placeholder:text-[#818184] outline-none transition-all focus:border-[#538d4e] focus:ring-2 focus:ring-[#538d4e]/20"
                            />
                        </div>
                    </div>
                    
                    <div className="mb-5 flex gap-1 rounded-xl bg-[#2a2a2c] p-1">
                        <button
                            onClick={() => setActiveTab("matchmaking")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "matchmaking"
                                    ? "bg-[#538d4e] text-white shadow-sm"
                                    : "text-[#818184] hover:text-[#e5e5e7]"
                                }`}
                        >
                            <Search className="h-4 w-4" />
                            Buscar partida
                        </button>
                        <button
                            onClick={() => setActiveTab("manual")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "manual"
                                    ? "bg-[#538d4e] text-white shadow-sm"
                                    : "text-[#818184] hover:text-[#e5e5e7]"
                                }`}
                        >
                            <Plus className="h-4 w-4" />
                            Crear/Unirse
                        </button>
                    </div>

                    {activeTab === "matchmaking" ? (
                        <div className="space-y-4">
                            <p className="text-sm text-[#818184]">
                                Te emparejaremos automáticamente con el siguiente jugador disponible.
                            </p>

                            {isQueueing && (
                                <div className="rounded-lg border border-[#3a3a3c] bg-[#2a2a2c] p-4">
                                    <p className="text-sm text-[#e5e5e7] font-medium">
                                        Buscando partida…
                                    </p>
                                    <p className="text-xs text-[#818184] mt-1">
                                        Te notificaremos cuando encontremos un rival.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleFindMatch}
                                    disabled={!canFindMatch}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <Search className="h-4 w-4" />
                                    Buscar partida
                                </button>

                                <button
                                    onClick={handleCancelFind}
                                    disabled={!canCancelFind}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#b91c1c] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-sm text-[#818184]">
                                    Crea una nueva sala y comparte el código con tu rival para empezar.
                                </p>
                                <button
                                    onClick={() => game.createRoom(name)}
                                    disabled={!canCreate}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear nueva sala
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label
                                        htmlFor="room-id"
                                        className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#818184]"
                                    >
                                        Código de sala
                                    </label>
                                    <input
                                        id="room-id"
                                        type="text"
                                        placeholder="Pega el código aquí..."
                                        value={roomInput}
                                        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                                        className="w-full rounded-xl border border-[#3a3a3c] bg-[#2a2a2c] px-4 py-3 text-sm text-[#e5e5e7] placeholder:text-[#818184] outline-none transition-all focus:border-[#538d4e] focus:ring-2 focus:ring-[#538d4e]/20"
                                    />
                                </div>
                                <button
                                    onClick={() => game.joinRoom(roomInput, name)}
                                    disabled={!canJoin}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#538d4e] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Unirse a la sala
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-[#818184]">
                    Ambos jugadores deben estar conectados para iniciar.
                </p>
            </div>
        </div>
    );
};

export default LobbyScreen;
