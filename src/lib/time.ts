const pad = (n: number) => String(n).padStart(2, "0");

export function formatMmSs(totalSec: number): string {
    const sec = Math.max(0, Math.floor(totalSec));
    return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}

export function parseMmSs(text: string): number | null {
    const match = /^\s*(\d{1,3}):([0-5]\d)\s*$/.exec(text);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(remainingMs: number): string {
    if (remainingMs >= 0) return formatMmSs(Math.ceil(remainingMs / 1000));
    return `+${formatMmSs(Math.floor(-remainingMs / 1000))}`;
}

export function formatMinutes(totalSec: number): string {
    const minutes = totalSec / 60;
    return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1).replace(".", ",")} menit`;
}
