export type Clip = 1 | 2 | 3;
export type RingStep = { clip: Clip; at: number };

export const CLIP_FILES: Record<Clip, string> = {
    1: "bell.mp3",
    2: "bell_2.mp3",
    3: "bell_3.mp3",
};

export const GROUP_GAP_SEC = 1;
export const FALLBACK_STRIKE_GAP_SEC = 0.3;

export function splitIntoClips(count: number): Clip[] {
    const groups: Clip[] = [];
    let remaining = Math.max(0, Math.floor(count));
    while (remaining > 3) {
        const take = remaining === 4 ? 2 : 3;
        groups.push(take);
        remaining -= take;
    }
    if (remaining > 0) groups.push(remaining as Clip);
    return groups;
}

export function planRing(count: number): RingStep[] {
    return splitIntoClips(count).map((clip, i) => ({ clip, at: i * GROUP_GAP_SEC }));
}
