"use client";

import { useEffect, useEffectEvent, useMemo, useReducer, useRef, useState } from "react";
import { currentSession, INITIAL_PLAYER, playerReducer } from "@/lib/player";
import type { Bell, Competition } from "@/lib/schema";
import { remainingMs, serializeRuntime } from "@/lib/timer-engine";
import { useRefetchOnChange } from "./useRefetchOnChange";

const storageKey = (id: string) => `itcc-timer-state-${id}`;

function readSaved(id: string): unknown {
    try {
        const raw = localStorage.getItem(storageKey(id));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeSaved(id: string, value: unknown) {
    try {
        localStorage.setItem(storageKey(id), JSON.stringify(value));
    } catch {
        return;
    }
}

const clockNow = () => ({ mono: performance.now(), epoch: Date.now() });

type Meta = { loading: boolean; notFound: boolean; error: Error | null };

export function usePlayer(id: string, onBell: (bell: Bell) => void) {
    const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER);
    const [meta, setMeta] = useState<Meta>({
        loading: true,
        notFound: false,
        error: null,
    });
    const [now, setNow] = useState(0);
    const handledSeq = useRef(0);

    useRefetchOnChange<Competition>(`/api/competitions/${encodeURIComponent(id)}`, (result) => {
        if (result.status === "ok") {
            dispatch({
                type: "config",
                competition: result.data,
                saved: readSaved(id),
                clock: clockNow(),
            });
            setMeta({ loading: false, notFound: false, error: null });
        } else if (result.status === "notFound") {
            setMeta({ loading: false, notFound: true, error: null });
        } else {
            setMeta((prev) => ({ ...prev, loading: false, error: result.error }));
        }
    });

    const onTick = useEffectEvent((t: number) => {
        const next = playerReducer(state, { type: "tick", now: t });
        if (next !== state) dispatch({ type: "tick", now: t });
        if (next.bellEvent && next.bellEvent.seq > handledSeq.current) {
            handledSeq.current = next.bellEvent.seq;
            onBell(next.bellEvent.bell);
        }
        setNow((prev) => (Math.floor(prev / 50) === Math.floor(t / 50) ? prev : t));
    });

    const running = state.runtime?.status === "running";
    useEffect(() => {
        if (!running) return;
        let frame = 0;
        const loop = () => {
            onTick(performance.now());
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        const interval = setInterval(() => onTick(performance.now()), 250);
        return () => {
            cancelAnimationFrame(frame);
            clearInterval(interval);
        };
    }, [running]);

    const session = currentSession(state);
    useEffect(() => {
        if (!state.runtime || !session) return;
        writeSaved(
            id,
            serializeRuntime(
                state.runtime,
                { competitionId: id, sessionId: session.id, teamName: state.teamName },
                clockNow(),
            ),
        );
    }, [id, state.runtime, state.teamName, session]);

    const actions = useMemo(
        () => ({
            toggle: () => dispatch({ type: "toggle", now: performance.now() }),
            reset: () => dispatch({ type: "reset" }),
            goTo: (index: number) => dispatch({ type: "goTo", index }),
            nextTeam: () => dispatch({ type: "nextTeam" }),
            setTeamName: (value: string) => dispatch({ type: "teamName", value }),
        }),
        [],
    );

    const remaining = state.runtime ? remainingMs(state.runtime, now) : 0;
    return { state, session, meta, remaining, actions };
}
