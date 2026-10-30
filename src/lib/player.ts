import { sameContent } from "./competition-doc";
import type { Bell, Competition } from "./schema";
import {
    collectDueBells,
    createRuntime,
    markFired,
    pause,
    remainingMs,
    restoreRuntime,
    start,
    type Clock,
    type Runtime,
} from "./timer-engine";

export type BellEvent = { bell: Bell; seq: number };

export type PlayerState = {
    config: Competition | null;
    pending: Competition | null;
    sessionIndex: number;
    runtime: Runtime | null;
    teamName: string;
    bellEvent: BellEvent | null;
};

export type PlayerAction =
    | { type: "config"; competition: Competition; saved?: unknown; clock: Clock }
    | { type: "toggle"; now: number }
    | { type: "reset" }
    | { type: "goTo"; index: number }
    | { type: "nextTeam" }
    | { type: "tick"; now: number }
    | { type: "teamName"; value: string };

export const INITIAL_PLAYER: PlayerState = {
    config: null,
    pending: null,
    sessionIndex: 0,
    runtime: null,
    teamName: "",
    bellEvent: null,
};

const TEAM_NAME_MAX = 80;

const contentOf = ({ name, category, sessions }: Competition) => ({ name, category, sessions });

function adopt(state: PlayerState, config: Competition, index?: number): PlayerState {
    const currentId = state.config?.sessions[state.sessionIndex]?.id;
    let next = index ?? config.sessions.findIndex((s) => s.id === currentId);
    next = Math.min(Math.max(next, 0), Math.max(config.sessions.length - 1, 0));
    const session = config.sessions[next];
    return {
        ...state,
        config,
        pending: null,
        sessionIndex: next,
        runtime: session ? createRuntime(session) : null,
    };
}

function goTo(state: PlayerState, index: number): PlayerState {
    const config = state.pending ?? state.config;
    if (!config) return state;
    const targetId = state.config?.sessions[index]?.id;
    const byId = config.sessions.findIndex((s) => s.id === targetId);
    return adopt(state, config, byId >= 0 ? byId : index);
}

export function currentSession(state: PlayerState) {
    return state.config?.sessions[state.sessionIndex] ?? null;
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
        case "config": {
            const incoming = action.competition;
            if (!state.config) {
                const initial = adopt(state, incoming, 0);
                const restored = restoreRuntime(action.saved, incoming, action.clock);
                return restored
                    ? {
                          ...initial,
                          sessionIndex: restored.sessionIndex,
                          runtime: restored.runtime,
                          teamName: restored.teamName,
                      }
                    : initial;
            }
            if (sameContent(contentOf(incoming), contentOf(state.config))) {
                return state.pending ? { ...state, pending: null } : state;
            }
            if (!state.runtime || state.runtime.status === "idle") return adopt(state, incoming);
            return { ...state, pending: incoming };
        }

        case "toggle": {
            if (!state.runtime) return state;
            const runtime =
                state.runtime.status === "running"
                    ? pause(state.runtime, action.now)
                    : start(state.runtime, action.now);
            return { ...state, runtime };
        }

        case "reset": {
            const config = state.pending ?? state.config;
            return config ? adopt(state, config) : state;
        }

        case "goTo":
            return goTo(state, action.index);

        case "nextTeam":
            return { ...goTo(state, 0), teamName: "" };

        case "tick": {
            const session = currentSession(state);
            if (!session || state.runtime?.status !== "running") return state;
            const due = collectDueBells(
                session,
                state.runtime,
                remainingMs(state.runtime, action.now),
            );
            if (due.length === 0) return state;
            return {
                ...state,
                runtime: markFired(state.runtime, due),
                bellEvent: { bell: due[due.length - 1], seq: (state.bellEvent?.seq ?? 0) + 1 },
            };
        }

        case "teamName":
            return { ...state, teamName: action.value.slice(0, TEAM_NAME_MAX) };
    }
}
