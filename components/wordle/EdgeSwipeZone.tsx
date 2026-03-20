"use client";

import React, { useRef } from "react";

export function EdgeSwipeZone({
    enabled = true,
    onTrigger,
    width = 12,
    threshold = 48,
    slope = 1.5,
    className = "",
}: {
    enabled?: boolean;
    onTrigger: () => void;
    width?: number;
    threshold?: number;
    slope?: number;
    className?: string;
}) {
    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);
    const active = useRef(false);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enabled) return;
        if (e.pointerType === "mouse") return;

        startX.current = e.clientX;
        startY.current = e.clientY;
        active.current = true;

        (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enabled || !active.current || startX.current == null || startY.current == null) return;

        const dx = e.clientX - startX.current;
        const dy = Math.abs(e.clientY - startY.current);

        if (dx > threshold && dx > dy * slope) {
            e.preventDefault();
            onTrigger();

            active.current = false;
            startX.current = null;
            startY.current = null;
        }
    };

    const onPointerUpOrCancel = () => {
        active.current = false;
        startX.current = null;
        startY.current = null;
    };

    return (
        <div
            className={`md:hidden fixed left-0 top-0 h-dvh z-40 ${className}`}
            style={{
                width,
                touchAction: "pan-y",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            aria-hidden
        />
    );
}

export function OverlaySwipeToClose({
    enabled = true,
    onClose,
    threshold = 48,
    slope = 1.5,
    className = "",
}: {
    enabled?: boolean;
    onClose: () => void;
    threshold?: number;
    slope?: number;
    className?: string;
}) {
    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);
    const active = useRef(false);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enabled) return;
        if (e.pointerType === "mouse") return;

        startX.current = e.clientX;
        startY.current = e.clientY;
        active.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enabled || !active.current || startX.current == null || startY.current == null) return;

        const dx = e.clientX - startX.current;
        const dy = Math.abs(e.clientY - startY.current);

        if (dx < -threshold && Math.abs(dx) > dy * slope) {
            e.preventDefault();
            onClose();
            active.current = false;
            startX.current = startY.current = null;
        }
    };

    const onPointerUpOrCancel = () => {
        active.current = false;
        startX.current = startY.current = null;
    };

    return (
        <div
            className={`md:hidden fixed inset-0 z-40 ${className}`}
            style={{
                touchAction: "pan-y",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            aria-hidden
        />
    );
}