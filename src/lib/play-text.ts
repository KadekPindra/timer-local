import type { Bell, Session } from "./schema";
import { formatMmSs } from "./time";
import { pendingBells, type Runtime } from "./timer-engine";

export function bellMoment(bell: Bell): string {
    if (bell.atSec === 0) return "WAKTU HABIS";
    if (bell.atSec % 60 === 0) return `SISA ${bell.atSec / 60} MENIT`;
    return `SISA ${formatMmSs(bell.atSec)}`;
}

export function bellToastText(bell: Bell): string {
    const moment = bellMoment(bell);
    return bell.count > 0 ? `LONCENG ${bell.count}× · ${moment}` : moment;
}

export function nextBellInfo(session: Session, rt: Runtime, remaining: number): string {
    const next = pendingBells(session, rt)[0];
    if (next) {
        const when = next.atSec === 0 ? "saat waktu habis" : `sisa ${formatMmSs(next.atSec)}`;
        const sound = next.count > 0 ? `${next.count}×` : "tanpa bunyi";
        return `Lonceng berikutnya: ${when} (${sound})`;
    }
    return remaining <= 0
        ? "Peserta melewati batas waktu. Lanjutkan ke sesi berikutnya bila juri siap."
        : "Semua lonceng sudah berbunyi.";
}

export function progressPct(rt: Runtime, remaining: number): number {
    if (rt.durationMs <= 0) return 100;
    return Math.min(100, Math.max(0, (1 - remaining / rt.durationMs) * 100));
}
