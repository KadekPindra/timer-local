"use client";

import { useEffect } from "react";

export function useWakeLock(active: boolean) {
    useEffect(() => {
        if (!active || !("wakeLock" in navigator)) return;
        let sentinel: WakeLockSentinel | null = null;
        let cancelled = false;

        const request = async () => {
            if (document.visibilityState !== "visible" || sentinel?.released === false) return;
            try {
                const lock = await navigator.wakeLock.request("screen");
                if (cancelled) await lock.release();
                else sentinel = lock;
            } catch {
                sentinel = null;
            }
        };

        void request();
        document.addEventListener("visibilitychange", request);
        return () => {
            cancelled = true;
            document.removeEventListener("visibilitychange", request);
            void sentinel?.release().catch(() => undefined);
        };
    }, [active]);
}
