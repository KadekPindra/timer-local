import { z } from "zod";
import type { Bell, Session, Tone } from "./schema";

export type TimerStatus = "idle" | "running" | "paused";

export type Runtime = {
    status: TimerStatus;
    durationMs: number;
    startedAt: number | null;
    elapsedBeforePauseMs: number;
    firedBellIds: string[];
};

export const STATUS_LABELS = {
    ready: "SIAP DIMULAI",
    remaining: "SISA WAKTU",
    warning: "SEGERA BERAKHIR",
    overtime: "WAKTU HABIS · LEBIH WAKTU",
} as const;
export type StatusLabel = (typeof STATUS_LABELS)[keyof typeof STATUS_LABELS];

export function createRuntime(session: Session): Runtime {
    return {
        status: "idle",
        durationMs: session.durationSec * 1000,
        startedAt: null,
        elapsedBeforePauseMs: 0,
        firedBellIds: [],
    };
}

export function start(rt: Runtime, now: number): Runtime {
    if (rt.status === "running") return rt;
    return { ...rt, status: "running", startedAt: now };
}

export function pause(rt: Runtime, now: number): Runtime {
    if (rt.status !== "running" || rt.startedAt === null) return rt;
    return {
        ...rt,
        status: "paused",
        startedAt: null,
        elapsedBeforePauseMs: rt.elapsedBeforePauseMs + (now - rt.startedAt),
    };
}

export function elapsedMs(rt: Runtime, now: number): number {
    const running =
        rt.status === "running" && rt.startedAt !== null ? Math.max(0, now - rt.startedAt) : 0;
    return rt.elapsedBeforePauseMs + running;
}

export function remainingMs(rt: Runtime, now: number): number {
    return rt.durationMs - elapsedMs(rt, now);
}

export function collectDueBells(session: Session, rt: Runtime, remaining: number): Bell[] {
    return session.bells
        .filter((b) => !rt.firedBellIds.includes(b.id) && b.atSec * 1000 >= remaining)
        .sort((a, b) => b.atSec - a.atSec);
}

export function markFired(rt: Runtime, bells: Bell[]): Runtime {
    if (bells.length === 0) return rt;
    return { ...rt, firedBellIds: [...rt.firedBellIds, ...bells.map((b) => b.id)] };
}

export function pendingBells(session: Session, rt: Runtime): Bell[] {
    return session.bells
        .filter((b) => !rt.firedBellIds.includes(b.id))
        .sort((a, b) => b.atSec - a.atSec);
}

export function currentTone(session: Session, rt: Runtime, remaining: number): Tone {
    if (remaining <= 0) return "red";
    const fired = session.bells.filter((b) => rt.firedBellIds.includes(b.id));
    if (fired.length === 0) return "blue";
    return fired.reduce((latest, b) => (b.atSec < latest.atSec ? b : latest)).tone;
}

export function statusLabel(session: Session, rt: Runtime, remaining: number): StatusLabel {
    if (rt.status === "idle") return STATUS_LABELS.ready;
    if (remaining <= 0) return STATUS_LABELS.overtime;
    return currentTone(session, rt, remaining) === "blue"
        ? STATUS_LABELS.remaining
        : STATUS_LABELS.warning;
}

export const RESTORE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const SavedTimerStateSchema = z.object({
    v: z.literal(1),
    competitionId: z.string(),
    sessionId: z.string(),
    status: z.enum(["idle", "running", "paused"]),
    startedAtEpoch: z.number().nullable(),
    elapsedBeforePauseMs: z.number().min(0),
    firedBellIds: z.array(z.string()),
    teamName: z.string(),
    savedAt: z.number(),
});
export type SavedTimerState = z.infer<typeof SavedTimerStateSchema>;

export type Clock = { mono: number; epoch: number };

export function serializeRuntime(
    rt: Runtime,
    context: { competitionId: string; sessionId: string; teamName: string },
    clock: Clock,
): SavedTimerState {
    return {
        v: 1,
        ...context,
        status: rt.status,
        startedAtEpoch: rt.startedAt === null ? null : clock.epoch - (clock.mono - rt.startedAt),
        elapsedBeforePauseMs: rt.elapsedBeforePauseMs,
        firedBellIds: rt.firedBellIds,
        savedAt: clock.epoch,
    };
}

export type RestoredTimer = { sessionIndex: number; runtime: Runtime; teamName: string };

export function restoreRuntime(
    saved: unknown,
    competition: { id: string; sessions: Session[] },
    clock: Clock,
): RestoredTimer | null {
    const parsed = SavedTimerStateSchema.safeParse(saved);
    if (!parsed.success) return null;
    const state = parsed.data;

    if (state.competitionId !== competition.id) return null;
    if (clock.epoch - state.savedAt > RESTORE_MAX_AGE_MS || state.savedAt > clock.epoch) {
        return null;
    }

    const sessionIndex = competition.sessions.findIndex((s) => s.id === state.sessionId);
    if (sessionIndex === -1) return null;
    const session = competition.sessions[sessionIndex];

    const startedAt =
        state.status === "running" && state.startedAtEpoch !== null
            ? clock.mono - (clock.epoch - state.startedAtEpoch)
            : null;
    const bellIds = new Set(session.bells.map((b) => b.id));

    return {
        sessionIndex,
        teamName: state.teamName,
        runtime: {
            status: state.status === "running" && startedAt === null ? "paused" : state.status,
            durationMs: session.durationSec * 1000,
            startedAt,
            elapsedBeforePauseMs: state.elapsedBeforePauseMs,
            firedBellIds: state.firedBellIds.filter((id) => bellIds.has(id)),
        },
    };
}
