"use client";

import { useEffect, useRef } from "react";
import { getFirebase } from "@/lib/firebase-client";
import { useAuth } from "@/hooks/use-auth";
import {
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    DocumentReference,
} from "firebase/firestore";
import { PresenceState } from "@/data/presence-state";

type Activity = "idle" | "queue" | "playing";

type Options = {
    heartbeatMs?: number;
    staleMs?: number;
    platform?: string;
    appVersion?: string;
};

export function usePresenceFirestore(opts: Options = {}) {
    const { user } = useAuth();
    const deps = getFirebase();
    const { db } = deps ?? {};

    const refRef = useRef<DocumentReference | null>(null);
    const lastStateRef = useRef<PresenceState>("offline");

    const bcRef = useRef<BroadcastChannel | null>(null);
    const leaderRef = useRef(false);
    const lastLeaderPingRef = useRef(Date.now());

    const writingRef = useRef(false);
    const lastWriteAtRef = useRef(0);
    const MIN_WRITE_MS = 5000;
    const heartbeatMs = opts.heartbeatMs ?? 60_000;

    const activityRef = useRef<Activity>("idle");
    const visibleRef = useRef<boolean>(true);

    const computePresence = (): PresenceState => {
        if (activityRef.current === "playing") return "playing";
        if (!visibleRef.current || activityRef.current === "queue") return "busy";
        return "online";
    };

    useEffect(() => {
        if (!user?.uid) return;

        const bc = new BroadcastChannel(`presence-${user.uid}`);
        bcRef.current = bc;

        let isLeader = false;
        let leaderPingIv: number | null = null;
        let leaderWatchIv: number | null = null;

        const LEADER_TTL = 5000;

        const becomeLeader = () => {
            if (isLeader) return;
            isLeader = true;
            leaderRef.current = true;
            bc.postMessage({ type: "LEADER_HELLO", t: Date.now() });
            leaderPingIv = window.setInterval(() => {
                bc.postMessage({ type: "LEADER_PING", t: Date.now() });
            }, 1000);
            void writeIfNeeded();
        };

        const resignLeader = () => {
            if (!isLeader) return;
            isLeader = false;
            leaderRef.current = false;
            if (leaderPingIv) {
                window.clearInterval(leaderPingIv);
                leaderPingIv = null;
            }
        };

        leaderWatchIv = window.setInterval(() => {
            if (Date.now() - lastLeaderPingRef.current > LEADER_TTL) {
                becomeLeader();
            }
        }, 1500);

        bc.onmessage = (ev) => {
            const { type, t, payload } = ev.data || {};
            if (type === "LEADER_PING") {
                lastLeaderPingRef.current = t || Date.now();
                resignLeader();
            }
            if (type === "LEADER_HELLO") {
                lastLeaderPingRef.current = t || Date.now();
                resignLeader();
            }
            if (type === "STATE_REQ" && leaderRef.current) {
                if (payload === "playing" || payload === "queue" || payload === "idle") {
                    activityRef.current = payload;
                } else if (
                    payload === "online" ||
                    payload === "busy" ||
                    payload === "playing"
                ) {
                    activityRef.current =
                        payload === "playing" ? "playing" : payload === "busy" ? "queue" : "idle";
                }
                void writeIfNeeded();
            }
        };

        const claimTimer = window.setTimeout(() => {
            if (Date.now() - lastLeaderPingRef.current > LEADER_TTL) {
                becomeLeader();
            }
        }, 1500);

        return () => {
            window.clearTimeout(claimTimer);
            if (leaderPingIv) window.clearInterval(leaderPingIv);
            if (leaderWatchIv) window.clearInterval(leaderWatchIv);
            bc.close();
        };
    }, [user?.uid]);

    useEffect(() => {
        if (!db || !user?.uid) return;

        const ref = doc(db, "presence", user.uid);
        refRef.current = ref;

        const bootstrap = async () => {
            try {
                await setDoc(
                    ref,
                    {
                        state: "online" as PresenceState,
                        lastSeen: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        platform: opts.platform ?? "web",
                        appVersion: opts.appVersion ?? "1.0.0",
                    },
                    { merge: true }
                );
                lastStateRef.current = "online";
            } catch {
            }
        };
        bootstrap();

        const hb = window.setInterval(async () => {
            if (!leaderRef.current || !refRef.current) return;
            try {
                await updateDoc(refRef.current, { lastSeen: serverTimestamp() });
            } catch {
            }
        }, heartbeatMs);

        const onVisibility = () => {
            visibleRef.current = document.visibilityState === "visible";
            if (leaderRef.current) void writeIfNeeded();
            else bcRef.current?.postMessage({
                type: "STATE_REQ",
                payload: visibleRef.current ? "online" : "busy",
            });
        };
        const onFocus = () => {
            visibleRef.current = true;
            if (leaderRef.current) void writeIfNeeded();
            else bcRef.current?.postMessage({ type: "STATE_REQ", payload: "online" });
        };
        const onBlur = () => {
            visibleRef.current = false;
            if (leaderRef.current) void writeIfNeeded();
            else bcRef.current?.postMessage({ type: "STATE_REQ", payload: "busy" });
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        const onPageHide = () => {
            if (!refRef.current) return;
            void updateDoc(refRef.current, {
                lastSeen: serverTimestamp(),
                state: "busy",
                updatedAt: serverTimestamp(),
            });
        };
        window.addEventListener("pagehide", onPageHide);

        return () => {
            window.clearInterval(hb);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("pagehide", onPageHide);
        };
    }, [db, user?.uid, heartbeatMs]);

    const writeIfNeeded = async () => {
        if (!leaderRef.current || !refRef.current) return;
        const next = computePresence();
        if (lastStateRef.current === next) return;

        const now = Date.now();
        if (now - lastWriteAtRef.current < MIN_WRITE_MS) return;

        if (writingRef.current) return;
        writingRef.current = true;
        try {
            await updateDoc(refRef.current, {
                state: next,
                updatedAt: serverTimestamp(),
            });
            lastStateRef.current = next;
            lastWriteAtRef.current = now;
        } catch {
        } finally {
            writingRef.current = false;
        }
    };

    const requestOrWrite = (payload: PresenceState | Activity) => {
        if (leaderRef.current) {
            if (payload === "playing" || payload === "queue" || payload === "idle") {
                activityRef.current = payload;
            } else {
                activityRef.current =
                    payload === "playing" ? "playing" : payload === "busy" ? "queue" : "idle";
            }
            void writeIfNeeded();
        } else {
            bcRef.current?.postMessage({ type: "STATE_REQ", payload });
        }
    };

    return {
        setOnline: () => requestOrWrite("idle"),
        setBusy: () => requestOrWrite("queue"),
        setPlaying: (on: boolean) => requestOrWrite(on ? "playing" : "idle"),
        staleMs: opts.staleMs ?? 180_000,
    };
}