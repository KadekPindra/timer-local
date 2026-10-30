"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
}

export function useFullscreen() {
    const isFullscreen = useSyncExternalStore(
        subscribe,
        () => document.fullscreenElement !== null,
        () => false,
    );
    const isSupported = useSyncExternalStore(
        subscribe,
        () => document.fullscreenEnabled,
        () => false,
    );
    return { isFullscreen, isSupported };
}

export function toggleFullscreen() {
    if (document.fullscreenElement) {
        void document.exitFullscreen();
    } else {
        void document.documentElement.requestFullscreen().catch(() => undefined);
    }
}
