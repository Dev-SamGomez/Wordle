import { io as ioClient, Socket } from "socket.io-client";

const URL = "http://172.16.14.204:3001";

const strategy: Record<string, any> = {
    Sowk: {
        0: { solveAt: 3 },
        1: { solveAt: 2 },
        2: { solveAt: 3 },
        3: { solveAt: 1 }
    },
    Josue: {
        0: { solveAt: 4 },
        1: { solveAt: 3 },
        2: { solveAt: 3 },
        3: { solveAt: 2 }
    },
    Alan: {
        0: { solveAt: 5 },
        1: { solveAt: null }
    },
    Gus: {
        0: { solveAt: null }
    }
};

function createPlayer(name: string, tab: number): Socket {
    const socket = ioClient(URL);
    let myRoomId: string | null = null;

    socket.on("connect", () => {
        console.log(`[P${tab}] ${name} conectado: ${socket.id}`);
        socket.emit("br_join_queue", { name });
    });

    socket.on("br_lobby_update", (d: any) => {
        console.log(`[P${tab}] LOBBY: ${d.players.length} jugadores | canStart:${d.canStart} | countdown:${d.countdownSeconds}s`);
    });

    socket.on("br_match_found", (d: any) => {
        myRoomId = d.roomId ?? null;
        console.log(`[P${tab}] MATCH FOUND - code:${d.code} | roomId:${myRoomId}`);
    });

    socket.on("countdown_tick", (n: number) => {
        console.log(`[P${tab}] TICK: ${n}`);
    });

    // socket.on("br_round_start", (d: any) => {
    //     console.log(`[P${tab}] ROUND START - ronda:${d.round} | palabra:${d.word} | timer:${d.roundTimerEndsAt}`);

    //     if (tab === 1 && myRoomId) {
    //         setTimeout(() => {
    //             console.log(`[P${tab}] enviando br_row_resolved...`);
    //             socket.emit("br_row_resolved", {
    //                 roomId: myRoomId,
    //                 wordIndex: d.round,
    //                 wasSolved: false,
    //                 wordFinished: false,
    //                 lastEval: ["absent", "absent", "absent", "absent", "absent"],
    //             });
    //         }, 1000);
    //     }
    // });

    socket.on("br_round_start", (d: any) => {

        console.log(`[P${tab}] ROUND START - ronda:${d.round} | palabra:${d.word}`);

        if (!myRoomId) return;

        const playerPlan = strategy[name];
        const roundPlan = playerPlan?.[d.round];

        let attempt = 0;

        const interval = setInterval(() => {

            attempt++;

            const solveAt = roundPlan?.solveAt;

            const solved = solveAt !== null && solveAt !== undefined && attempt === solveAt;

            const finished = solved || attempt >= 6;

            console.log(`[P${tab}] intento ${attempt} solved:${solved}`);

            socket.emit("br_row_resolved", {
                roomId: myRoomId,
                wordIndex: d.round,
                wasSolved: solved,
                wordFinished: finished,
                lastEval: solved
                    ? ["correct", "correct", "correct", "correct", "correct"]
                    : ["absent", "absent", "absent", "absent", "absent"],
            });

            if (finished) {
                clearInterval(interval);
            }

        }, 1000);

    });

    socket.on("br_row_ack", (d: any) => {
        console.log(`[P${tab}] ROW ACK - accepted:${d.accepted} | intento:${d.currentAttempt}`);
    });

    socket.on("br_player_progress", (d: any) => {
        console.log(`[P${tab}] PROGRESS - ${d.name} intento:${d.currentAttempt}`);
    });

    socket.on("br_round_end", (d: any) => {
        console.log(`[P${tab}] ROUND END - eliminados: [${d.eliminated.map((e: any) => e.name).join(", ")}]`);
        console.log(`[P${tab}]             supervivientes: [${d.survivors.map((e: any) => e.name).join(", ")}]`);
    });

    socket.on("br_sudden_death", (d: any) => {
        console.log(`[P${tab}] *** SUDDEN DEATH - ronda:${d.round} ***`);
    });

    socket.on("br_game_over", (d: any) => {
        console.log(`[P${tab}] GAME OVER - ganador: ${d.winnerName ?? "ninguno"}`);
        console.log(`[P${tab}] Posiciones finales:`);
        d.finalPositions.forEach((p: any) => {
            console.log(`         ${p.position}. ${p.name} | palabras:${p.wordsResolved} | cups:${p.cupsChange > 0 ? "+" : ""}${p.cupsChange}`);
        });
        socket.disconnect();
    });

    socket.on("connect_error", (e: Error) => {
        console.error(`[P${tab}] Error conexion:`, e.message);
    });

    return socket;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("=== TEST BATTLE ROYALE ===\n");
    console.log("Conectando 4 jugadores...\n");

    const p1 = createPlayer("Sowk", 1);
    await delay(500);
    const p2 = createPlayer("Alan", 2);
    await delay(500);
    const p3 = createPlayer("Josue", 3);
    await delay(500);
    const p4 = createPlayer("Gus", 4);

    await delay(3000);
    console.log("\n[TEST] Force start desde P1...\n");
    p1.emit("br_force_start");

    await delay(60000);
    console.log("\n[TEST] Timeout — cerrando");
    process.exit(0);
}

runTest();