"use client";

import { useEffect, useEffectEvent } from "react";

const TYPING_TARGET = "input, textarea, select, [contenteditable='true']";

function isTyping(target: EventTarget | null) {
    return target instanceof Element && target.closest(TYPING_TARGET) !== null;
}

export function useHotkeys(handlers: Record<string, () => void>) {
    const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (isTyping(event.target) || document.querySelector("dialog[open]")) return;

        const key = event.code === "Space" ? "space" : event.key.toLowerCase();
        const handler = handlers[key];
        if (!handler) return;
        event.preventDefault();
        if (!event.repeat) handler();
    });

    const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
        if (event.code !== "Space" || isTyping(event.target)) return;
        if (document.querySelector("dialog[open]")) return;
        event.preventDefault();
    });

    useEffect(() => {
        const down = (event: KeyboardEvent) => onKeyDown(event);
        const up = (event: KeyboardEvent) => onKeyUp(event);
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        return () => {
            window.removeEventListener("keydown", down);
            window.removeEventListener("keyup", up);
        };
    }, []);
}
