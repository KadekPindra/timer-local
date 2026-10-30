import { describe, expect, it } from "vitest";
import { bellMoment, bellToastText, nextBellInfo, progressPct } from "./play-text";
import type { Session } from "./schema";
import { createRuntime, markFired } from "./timer-engine";

const session: Session = {
    id: "s1",
    name: "Presentasi",
    durationSec: 600,
    bells: [
        { id: "b0", atSec: 0, count: 2, tone: "red" },
        { id: "b300", atSec: 300, count: 1, tone: "orange" },
        { id: "b90", atSec: 90, count: 0, tone: "red" },
    ],
};

describe("teks lonceng", () => {
    it("bellMoment memakai menit bulat kalau bisa", () => {
        expect(bellMoment(session.bells[0])).toBe("WAKTU HABIS");
        expect(bellMoment(session.bells[1])).toBe("SISA 5 MENIT");
        expect(bellMoment(session.bells[2])).toBe("SISA 01:30");
    });

    it("bellToastText menyebut jumlah bunyi, kecuali 0×", () => {
        expect(bellToastText(session.bells[1])).toBe("LONCENG 1× · SISA 5 MENIT");
        expect(bellToastText(session.bells[0])).toBe("LONCENG 2× · WAKTU HABIS");
        expect(bellToastText(session.bells[2])).toBe("SISA 01:30");
    });
});

describe("nextBellInfo", () => {
    it("menyebut lonceng berikutnya yang belum berbunyi", () => {
        let rt = createRuntime(session);
        expect(nextBellInfo(session, rt, 600_000)).toBe("Lonceng berikutnya: sisa 05:00 (1×)");
        rt = markFired(rt, [session.bells[1]]);
        expect(nextBellInfo(session, rt, 200_000)).toBe(
            "Lonceng berikutnya: sisa 01:30 (tanpa bunyi)",
        );
        rt = markFired(rt, [session.bells[2]]);
        expect(nextBellInfo(session, rt, 60_000)).toBe("Lonceng berikutnya: saat waktu habis (2×)");
    });

    it("setelah semua berbunyi: pesan lebih waktu atau semua sudah berbunyi", () => {
        const rt = markFired(createRuntime(session), session.bells);
        expect(nextBellInfo(session, rt, -5_000)).toMatch(/melewati batas waktu/);
        expect(nextBellInfo(session, rt, 5_000)).toBe("Semua lonceng sudah berbunyi.");
    });
});

describe("progressPct", () => {
    it("0% di awal, 50% di tengah, mentok 100% saat lebih waktu", () => {
        const rt = createRuntime(session);
        expect(progressPct(rt, 600_000)).toBe(0);
        expect(progressPct(rt, 300_000)).toBe(50);
        expect(progressPct(rt, -10_000)).toBe(100);
    });
});
