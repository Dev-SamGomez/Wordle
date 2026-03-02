"use client";

import { useMultiplayer } from "@/hooks/use-multiplayergame";
import LobbyScreen from "./lobby-screen";
import WaitingScreen from "./waiting-screen";
import CountdownScreen from "./countdown-screen";
import PlayingScreen from "./playing-screen";
import FinishedScreen from "./finished-screen";

export default function MultiplayerHome() {
    const game = useMultiplayer();

    if (!game.roomId) {
        return <LobbyScreen game={game} />;
    }

    if (game.gameStatus === "waiting") {
        return <WaitingScreen roomId={game.roomId} />;
    }

    if (game.gameStatus === "countdown") {
        return <CountdownScreen
            countdown={game.countdown}
            myName={game.myName}
            opponentName={game.opponentName}
        />;
    }

    if (game.gameStatus === "playing") {
        return <PlayingScreen game={game} />;
    }

    if (game.gameStatus === "finished") {
        return <FinishedScreen
            winnerSocketId={game.winnerSocketId}
            mySocketId={game.mySocketId}
            rematchStatus={game.rematchStatus}
            onRematch={game.requestRematch}
            onLeave={game.leaveRoom}
            roundResultsPlayer={game.roundResultsPlayer}
            roundResultsRival={game.roundResultsRival}
        />;
    }

    return null;
}
