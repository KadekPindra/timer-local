const CHANNEL = "itcc-timer-data";
const STORAGE_KEY = "itcc-timer-data-changed";

const localListeners = new Set<() => void>();

function hasBroadcastChannel(): boolean {
    return typeof BroadcastChannel !== "undefined";
}

/** Beri tahu semua tab (dan komponen di tab ini) bahwa data lomba berubah. */
export function notifyDataChanged(): void {
    if (typeof window === "undefined") return;

    if (hasBroadcastChannel()) {
        // Instance baru supaya pendengar di tab ini juga menerima pesannya.
        const channel = new BroadcastChannel(CHANNEL);
        channel.postMessage("changed");
        channel.close();
        return;
    }

    localListeners.forEach((listener) => listener());
    try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
        return;
    }
}

export function onDataChanged(callback: () => void): () => void {
    if (hasBroadcastChannel()) {
        const channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = () => callback();
        return () => channel.close();
    }

    const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) callback();
    };
    localListeners.add(callback);
    window.addEventListener("storage", onStorage);
    return () => {
        localListeners.delete(callback);
        window.removeEventListener("storage", onStorage);
    };
}
