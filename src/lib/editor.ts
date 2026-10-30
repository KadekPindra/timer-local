import { LIMITS, newBell, type Bell, type Session } from "./schema";

export function moveItem<T>(items: T[], index: number, offset: -1 | 1): T[] {
    const target = index + offset;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function sortBellsForDisplay(bells: Bell[]): Bell[] {
    return [...bells].sort((a, b) => b.atSec - a.atSec);
}

const SUGGESTED_AT_SEC = [300, 120, 60, 30];

export function suggestBellAtSec(session: Session): number | null {
    const used = new Set(session.bells.map((b) => b.atSec));
    const fits = (s: number) => s > 0 && s < session.durationSec && !used.has(s);

    const preferred = [...SUGGESTED_AT_SEC, Math.floor(session.durationSec / 2)].find(fits);
    if (preferred !== undefined) return preferred;
    for (let s = session.durationSec - 1; s > 0; s--) if (fits(s)) return s;
    return null;
}

export function addSuggestedBell(session: Session): Session {
    if (session.bells.length >= LIMITS.bellsPerSession) return session;
    const atSec = suggestBellAtSec(session);
    if (atSec === null) return session;
    return { ...session, bells: [...session.bells, newBell(atSec, 1, "orange")] };
}

export function bellPositionPct(atSec: number, durationSec: number): number {
    if (durationSec <= 0) return 100;
    return Math.min(100, Math.max(0, (1 - atSec / durationSec) * 100));
}

export function warningStartPct(session: Session): number {
    const warnings = session.bells.filter((b) => b.tone !== "blue");
    if (warnings.length === 0) return 100;
    return bellPositionPct(Math.max(...warnings.map((b) => b.atSec)), session.durationSec);
}

export function splitDuration(totalSec: number): { minutes: number; seconds: number } {
    return { minutes: Math.floor(totalSec / 60), seconds: totalSec % 60 };
}
