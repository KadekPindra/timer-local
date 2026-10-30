"use client";

import { useEffect, useEffectEvent } from "react";
import { onDataChanged } from "@/lib/data-events";

export type FetchResult<T> =
    { status: "ok"; data: T } | { status: "notFound" } | { status: "error"; error: Error };

async function load<T>(url: string): Promise<FetchResult<T>> {
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.status === 404) return { status: "notFound" };
        if (!response.ok) throw new Error(`Server menjawab ${response.status}.`);
        return { status: "ok", data: (await response.json()) as T };
    } catch (error) {
        return {
            status: "error",
            error: error instanceof Error ? error : new Error("Gagal memuat."),
        };
    }
}

/**
 * Mengambil `url` saat mount, lalu mengambil ulang ketika data berubah (BroadcastChannel),
 * tab kembali terlihat, atau jendela mendapat fokus. Respons dari request lama diabaikan.
 */
export function useRefetchOnChange<T>(url: string, onResult: (result: FetchResult<T>) => void) {
    const deliver = useEffectEvent(onResult);

    useEffect(() => {
        let latest = 0;
        let active = true;

        const refetch = async () => {
            const mine = ++latest;
            const result = await load<T>(url);
            if (active && mine === latest) deliver(result);
        };

        const onVisible = () => {
            if (document.visibilityState === "visible") void refetch();
        };

        void refetch();
        const stopListening = onDataChanged(() => void refetch());
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", refetch);

        return () => {
            active = false;
            stopListening();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", refetch);
        };
    }, [url]);
}
