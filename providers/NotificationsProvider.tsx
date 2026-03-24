"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { onIncomingChallengesSnapshot, onOutgoingChallengesSnapshot } from "@/utils/challenges";
import { useToast } from "@/context/ToastContext";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { pushToast } = useToast();

    const notifiedChallenges = useRef(new Set<string>());

    useEffect(() => {
        if (!user?.uid) return;

        const off = onIncomingChallengesSnapshot((challenges: any[]) => {

            const pending = challenges.filter(
                (c) => c.status === "pending" && c.toUid === user.uid
            );

            for (const ch of pending) {
                if (notifiedChallenges.current.has(ch.id)) continue;

                notifiedChallenges.current.add(ch.id);

                const sender =
                    ch.from?.nickname ??
                    ch.fromNickname ??
                    "Jugador";

                const roomCode = ch.roomCode ?? ch.code;

                pushToast({
                    kind: "success",
                    msg: roomCode
                        ? `${sender} te desafió (código: ${roomCode})`
                        : `${sender} te ha enviado un desafío`,
                });
            }
        });

        return () => off?.();
    }, [user?.uid]);

    return children;
}