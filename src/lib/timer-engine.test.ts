import { describe, expect, it } from "vitest";
import type { Session } from "./schema";
import {
    collectDueBells,
    createRuntime,
    currentTone,
    markFired,
    pause,
    pendingBells,
    remainingMs,
    restoreRuntime,
    RESTORE_MAX_AGE_MS,
    serializeRuntime,
    start,
    STATUS_LABELS,
    statusLabel,
} from "./timer-engine";

const presentasi: Session = {
    id: "s1",
    name: "Presentasi",
    durationSec: 600,
    bells: [
        { id: "b0", atSec: 0, count: 2, tone: "red" },
        { id: "b300", atSec: 300, count: 1, tone: "orange" },
    ],
};

const tanyaJawab: Session = {
    id: "s2",
    name: "Tanya Jawab",
    durationSec: 300,
    bells: [{ id: "t0", atSec: 0, count: 2, tone: "red" }],
};

const competition = { id: "c1", sessions: [presentasi, tanyaJawab] };

describe("start / pause / remainingMs", () => {
    it("runtime baru idle dengan durasi penuh", () => {
        const rt = createRuntime(presentasi);
        expect(rt.status).toBe("idle");
        expect(remainingMs(rt, 999_999)).toBe(600_000);
    });

    it("start → 1 detik → sisa berkurang 1000 ms", () => {
        const rt = start(createRuntime(presentasi), 1_000);
        expect(remainingMs(rt, 2_000)).toBe(599_000);
    });

    it("waktu selama jeda tidak mengurangi sisa", () => {
        let rt = start(createRuntime(presentasi), 0);
        rt = pause(rt, 5_000);
        expect(remainingMs(rt, 15_000)).toBe(595_000);
        rt = start(rt, 15_000);
        expect(remainingMs(rt, 16_000)).toBe(594_000);
    });

    it("start saat berjalan dan pause saat tidak berjalan tidak mengubah apa pun", () => {
        const running = start(createRuntime(presentasi), 0);
        expect(start(running, 5_000)).toBe(running);
        const idle = createRuntime(presentasi);
        expect(pause(idle, 5_000)).toBe(idle);
    });

    it("jam render yang tertinggal dari waktu start tidak membuat sisa melebihi durasi", () => {
        const rt = start(createRuntime(presentasi), 5_000);
        expect(remainingMs(rt, 4_900)).toBe(600_000);
    });

    it("tetap menghitung setelah melewati nol (lebih waktu)", () => {
        const rt = start(createRuntime(tanyaJawab), 0);
        expect(remainingMs(rt, 323_400)).toBe(-23_400);
    });

    it("reset (createRuntime) mengosongkan lonceng dan kembali ke durasi penuh", () => {
        let rt = start(createRuntime(presentasi), 0);
        rt = markFired(rt, collectDueBells(presentasi, rt, remainingMs(rt, 400_000)));
        expect(rt.firedBellIds).toEqual(["b300"]);
        rt = createRuntime(presentasi);
        expect(rt.firedBellIds).toEqual([]);
        expect(rt.status).toBe("idle");
        expect(remainingMs(rt, 0)).toBe(600_000);
    });
});

describe("lonceng", () => {
    it("lonceng 300 berbunyi tepat sekali saat sisa mencapai 05:00", () => {
        let rt = start(createRuntime(presentasi), 0);
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 299_999))).toEqual([]);

        const due = collectDueBells(presentasi, rt, remainingMs(rt, 300_000));
        expect(due.map((b) => b.id)).toEqual(["b300"]);
        rt = markFired(rt, due);

        expect(collectDueBells(presentasi, rt, remainingMs(rt, 300_250))).toEqual([]);
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 400_000))).toEqual([]);
    });

    it("lompatan besar (tab tidur 320 dtk → −5 dtk) mengembalikan semua lonceng, terakhir = 00:00", () => {
        let rt = start(createRuntime(presentasi), 0);
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 280_000))).toEqual([]);

        const due = collectDueBells(presentasi, rt, remainingMs(rt, 605_000));
        expect(due.map((b) => b.id)).toEqual(["b300", "b0"]);
        expect(due.at(-1)?.id).toBe("b0");

        rt = markFired(rt, due);
        expect(rt.firedBellIds).toEqual(["b300", "b0"]);
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 610_000))).toEqual([]);
    });

    it("lonceng 00:00 berbunyi tepat saat sisa 0", () => {
        let rt = start(createRuntime(presentasi), 0);
        rt = markFired(rt, collectDueBells(presentasi, rt, remainingMs(rt, 300_000)));
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 599_999))).toEqual([]);
        expect(collectDueBells(presentasi, rt, remainingMs(rt, 600_000)).map((b) => b.id)).toEqual([
            "b0",
        ]);
    });

    it("pendingBells() urut dari yang paling dulu berbunyi", () => {
        let rt = createRuntime(presentasi);
        expect(pendingBells(presentasi, rt).map((b) => b.id)).toEqual(["b300", "b0"]);
        rt = markFired(rt, [presentasi.bells[1]]);
        expect(pendingBells(presentasi, rt).map((b) => b.id)).toEqual(["b0"]);
    });
});

describe("currentTone", () => {
    const withBlueAfterOrange: Session = {
        ...presentasi,
        bells: [...presentasi.bells, { id: "b120", atSec: 120, count: 1, tone: "blue" }],
    };

    it("biru sebelum ada lonceng", () => {
        const rt = createRuntime(presentasi);
        expect(currentTone(presentasi, rt, 600_000)).toBe("blue");
    });

    it("oranye setelah lonceng oranye berbunyi", () => {
        const rt = markFired(createRuntime(presentasi), [presentasi.bells[1]]);
        expect(currentTone(presentasi, rt, 250_000)).toBe("orange");
    });

    it("kembali biru kalau lonceng terakhir yang berbunyi berwarna biru", () => {
        const rt = markFired(createRuntime(withBlueAfterOrange), [
            withBlueAfterOrange.bells[1],
            withBlueAfterOrange.bells[2],
        ]);
        expect(currentTone(withBlueAfterOrange, rt, 100_000)).toBe("blue");
    });

    it("selalu merah saat sisa ≤ 0", () => {
        const rt = createRuntime(presentasi);
        expect(currentTone(presentasi, rt, 0)).toBe("red");
        expect(currentTone(presentasi, rt, -5_000)).toBe("red");
    });
});

describe("statusLabel", () => {
    const redEarly: Session = {
        ...presentasi,
        bells: [
            { id: "b0", atSec: 0, count: 2, tone: "red" },
            { id: "b60", atSec: 60, count: 1, tone: "red" },
        ],
    };

    it("idle → SIAP DIMULAI", () => {
        expect(statusLabel(presentasi, createRuntime(presentasi), 600_000)).toBe(
            STATUS_LABELS.ready,
        );
    });

    it("berjalan tanpa lonceng → SISA WAKTU", () => {
        const rt = start(createRuntime(presentasi), 0);
        expect(statusLabel(presentasi, rt, 500_000)).toBe(STATUS_LABELS.remaining);
    });

    it("setelah lonceng oranye → SEGERA BERAKHIR", () => {
        const rt = markFired(start(createRuntime(presentasi), 0), [presentasi.bells[1]]);
        expect(statusLabel(presentasi, rt, 200_000)).toBe(STATUS_LABELS.warning);
    });

    it("lonceng merah di sisa 01:00 → SEGERA BERAKHIR, bukan WAKTU HABIS", () => {
        const rt = markFired(start(createRuntime(redEarly), 0), [redEarly.bells[1]]);
        expect(currentTone(redEarly, rt, 59_000)).toBe("red");
        expect(statusLabel(redEarly, rt, 59_000)).toBe(STATUS_LABELS.warning);
    });

    it("sisa ≤ 0 → WAKTU HABIS · LEBIH WAKTU, juga saat dijeda", () => {
        const rt = start(createRuntime(presentasi), 0);
        expect(statusLabel(presentasi, rt, 0)).toBe(STATUS_LABELS.overtime);
        expect(statusLabel(presentasi, pause(rt, 610_000), -10_000)).toBe(STATUS_LABELS.overtime);
    });
});

describe("serializeRuntime / restoreRuntime", () => {
    const EPOCH = 1_790_000_000_000;
    const context = { competitionId: "c1", sessionId: "s1", teamName: "Tim Kintamani" };

    it("timer berjalan pulih setelah reload 30 detik dengan sisa yang benar", () => {
        const rt = start(createRuntime(presentasi), 10_000);
        const saved = serializeRuntime(rt, context, { mono: 50_000, epoch: EPOCH });
        expect(remainingMs(rt, 50_000)).toBe(560_000);

        const restored = restoreRuntime(saved, competition, { mono: 200, epoch: EPOCH + 30_000 });
        expect(restored).not.toBeNull();
        expect(restored!.sessionIndex).toBe(0);
        expect(restored!.teamName).toBe("Tim Kintamani");
        expect(restored!.runtime.status).toBe("running");
        expect(remainingMs(restored!.runtime, 200)).toBe(530_000);
    });

    it("lonceng yang terlewati selama reload dikembalikan untuk dibunyikan", () => {
        const rt = start(createRuntime(presentasi), 0);
        const saved = serializeRuntime(rt, context, { mono: 290_000, epoch: EPOCH });

        const restored = restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH + 30_000 });
        const remaining = remainingMs(restored!.runtime, 0);
        expect(remaining).toBe(280_000);
        expect(collectDueBells(presentasi, restored!.runtime, remaining).map((b) => b.id)).toEqual([
            "b300",
        ]);
    });

    it("timer yang dijeda tetap dijeda dengan sisa yang sama", () => {
        const rt = pause(start(createRuntime(presentasi), 0), 120_000);
        const saved = serializeRuntime(rt, context, { mono: 500_000, epoch: EPOCH });
        const restored = restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH + 60_000 });
        expect(restored!.runtime.status).toBe("paused");
        expect(remainingMs(restored!.runtime, 0)).toBe(480_000);
    });

    it("pulih ke sesi yang benar berdasarkan sessionId", () => {
        const rt = createRuntime(tanyaJawab);
        const saved = serializeRuntime(
            rt,
            { ...context, sessionId: "s2" },
            { mono: 0, epoch: EPOCH },
        );
        expect(restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH })?.sessionIndex).toBe(1);
    });

    it("membuang id lonceng yang sudah tidak ada di konfigurasi", () => {
        const rt = { ...createRuntime(presentasi), firedBellIds: ["b300", "lama"] };
        const saved = serializeRuntime(rt, context, { mono: 0, epoch: EPOCH });
        expect(
            restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH })?.runtime.firedBellIds,
        ).toEqual(["b300"]);
    });

    it("menolak data lebih dari 12 jam, dari masa depan, lomba lain, sesi terhapus, atau rusak", () => {
        const saved = serializeRuntime(createRuntime(presentasi), context, {
            mono: 0,
            epoch: EPOCH,
        });
        const clock = { mono: 0, epoch: EPOCH };

        expect(
            restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH + RESTORE_MAX_AGE_MS + 1 }),
        ).toBeNull();
        expect(restoreRuntime(saved, competition, { mono: 0, epoch: EPOCH - 1 })).toBeNull();
        expect(restoreRuntime(saved, { ...competition, id: "c2" }, clock)).toBeNull();
        expect(restoreRuntime({ ...saved, sessionId: "hilang" }, competition, clock)).toBeNull();
        expect(restoreRuntime({ v: 2 }, competition, clock)).toBeNull();
        expect(restoreRuntime(null, competition, clock)).toBeNull();
        expect(restoreRuntime("rusak", competition, clock)).toBeNull();
    });
});
