"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BELL_AUDIO } from "@/lib/bell-audio.generated";
import { FALLBACK_STRIKE_GAP_SEC, planRing, type Clip } from "@/lib/bell-plan";

const VOLUME_KEY = "itcc-timer-volume";
const VOLUME_EVENT = "itcc-timer-volume";
const DEFAULT_VOLUME = 0.8;
const LOAD_WAIT_MS = 1500;

type Buffers = Record<Clip, Promise<AudioBuffer | null>>;

let memoryVolume = DEFAULT_VOLUME;

function readVolume(): number {
    try {
        const raw = localStorage.getItem(VOLUME_KEY);
        const stored = Number(raw);
        if (raw !== null && stored >= 0 && stored <= 1) return stored;
    } catch {
        return memoryVolume;
    }
    return memoryVolume;
}

function writeVolume(value: number) {
    memoryVolume = value;
    try {
        localStorage.setItem(VOLUME_KEY, String(value));
    } catch {
        return;
    }
}

function subscribeVolume(onChange: () => void) {
    window.addEventListener(VOLUME_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
        window.removeEventListener(VOLUME_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

function synthBell(ctx: AudioContext, out: AudioNode, t0: number) {
    [880, 1320, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.35 / (i + 1), t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
        osc.connect(gain).connect(out);
        osc.start(t0);
        osc.stop(t0 + 1.5);
    });
}

async function decodeClip(ctx: AudioContext, base64: string): Promise<AudioBuffer | null> {
    try {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return await ctx.decodeAudioData(bytes.buffer);
    } catch {
        return null;
    }
}

const wait = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

const loadOrTimeout = (buffer: Promise<AudioBuffer | null>) =>
    Promise.race([buffer, wait(LOAD_WAIT_MS)]);

function play(ctx: AudioContext, out: AudioNode, buffer: AudioBuffer, t0: number) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(out);
    source.start(t0);
}

export type AudioStatus = "idle" | "suspended" | "running";

export function useBell() {
    const ctxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const buffersRef = useRef<Buffers | null>(null);
    const [status, setStatus] = useState<AudioStatus>("idle");
    const volume = useSyncExternalStore(subscribeVolume, readVolume, () => DEFAULT_VOLUME);

    const ensureContext = useCallback((): AudioContext | null => {
        if (ctxRef.current) return ctxRef.current;
        if (typeof window === "undefined" || !window.AudioContext) return null;

        const ctx = new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = readVolume();
        gain.connect(ctx.destination);
        ctxRef.current = ctx;
        gainRef.current = gain;
        buffersRef.current = {
            1: decodeClip(ctx, BELL_AUDIO[1]),
            2: decodeClip(ctx, BELL_AUDIO[2]),
            3: decodeClip(ctx, BELL_AUDIO[3]),
        };

        const sync = () => setStatus(ctx.state === "running" ? "running" : "suspended");
        ctx.addEventListener("statechange", sync);
        sync();
        return ctx;
    }, []);

    useEffect(() => {
        if (gainRef.current) gainRef.current.gain.value = volume;
    }, [volume]);

    useEffect(() => () => void ctxRef.current?.close(), []);

    const unlock = useCallback(async () => {
        const ctx = ensureContext();
        if (ctx && ctx.state !== "running") await ctx.resume().catch(() => undefined);
    }, [ensureContext]);

    const ring = useCallback(
        async (count: number) => {
            const ctx = ensureContext();
            const out = gainRef.current;
            const buffers = buffersRef.current;
            const steps = planRing(count);
            if (!ctx || !out || !buffers || steps.length === 0) return;

            await Promise.race([ctx.resume().catch(() => undefined), wait(300)]);
            if (ctx.state !== "running") return;
            const [single, ...clips] = await Promise.all([
                loadOrTimeout(buffers[1]),
                ...steps.map((step) => loadOrTimeout(buffers[step.clip])),
            ]);
            const start = ctx.currentTime + 0.05;

            steps.forEach((step, i) => {
                const t0 = start + step.at;
                const clip = clips[i];
                if (clip) {
                    play(ctx, out, clip, t0);
                    return;
                }
                for (let k = 0; k < step.clip; k++) {
                    const tk = t0 + k * FALLBACK_STRIKE_GAP_SEC;
                    if (single) play(ctx, out, single, tk);
                    else synthBell(ctx, out, tk);
                }
            });
        },
        [ensureContext],
    );

    const setVolume = useCallback((next: number) => {
        writeVolume(Math.min(1, Math.max(0, next)));
        window.dispatchEvent(new Event(VOLUME_EVENT));
    }, []);

    return { ring, unlock, volume, setVolume, status };
}
