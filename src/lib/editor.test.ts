import { describe, expect, it } from "vitest";
import {
    addSuggestedBell,
    bellPositionPct,
    moveItem,
    sortBellsForDisplay,
    splitDuration,
    suggestBellAtSec,
    warningStartPct,
} from "./editor";
import { newBell, newSession, type Session } from "./schema";

const presentasi: Session = {
    id: "s1",
    name: "Presentasi",
    durationSec: 600,
    bells: [
        { id: "b0", atSec: 0, count: 2, tone: "red" },
        { id: "b300", atSec: 300, count: 1, tone: "orange" },
    ],
};

describe("moveItem", () => {
    it("menukar posisi dengan tetangga", () => {
        expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
        expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    });

    it("tidak berubah di ujung daftar", () => {
        const items = ["a", "b"];
        expect(moveItem(items, 0, -1)).toBe(items);
        expect(moveItem(items, 1, 1)).toBe(items);
    });
});

describe("lonceng", () => {
    it("sortBellsForDisplay mengurutkan dari sisa terbesar", () => {
        expect(sortBellsForDisplay(presentasi.bells).map((b) => b.atSec)).toEqual([300, 0]);
    });

    it("suggestBellAtSec memilih angka bulat yang belum dipakai dan muat di durasi", () => {
        expect(suggestBellAtSec(presentasi)).toBe(120);
        expect(suggestBellAtSec(newSession("x", 600))).toBe(300);
        expect(suggestBellAtSec(newSession("x", 90))).toBe(60);
        expect(suggestBellAtSec(newSession("x", 20))).toBe(10);
        expect(suggestBellAtSec(newSession("x", 1))).toBeNull();
    });

    it("addSuggestedBell menambah lonceng oranye 1× dan berhenti di batas 10", () => {
        const added = addSuggestedBell(presentasi);
        expect(added.bells).toHaveLength(3);
        expect(added.bells[2]).toMatchObject({ atSec: 120, count: 1, tone: "orange" });

        const full = {
            ...presentasi,
            bells: Array.from({ length: 10 }, (_, i) => newBell(i * 10, 1, "red")),
        };
        expect(addSuggestedBell(full)).toBe(full);
    });
});

describe("timeline", () => {
    it("bellPositionPct: 05:00 dari 10:00 = 50%, 00:00 = 100%", () => {
        expect(bellPositionPct(300, 600)).toBe(50);
        expect(bellPositionPct(0, 600)).toBe(100);
        expect(bellPositionPct(900, 600)).toBe(0);
    });

    it("warningStartPct mulai dari lonceng non-biru paling awal", () => {
        expect(warningStartPct(presentasi)).toBe(50);
        expect(warningStartPct(newSession("x", 300))).toBe(100);
        expect(
            warningStartPct({
                ...presentasi,
                bells: [...presentasi.bells, { id: "x", atSec: 480, count: 1, tone: "blue" }],
            }),
        ).toBe(50);
    });

    it("splitDuration memecah detik jadi menit dan detik", () => {
        expect(splitDuration(600)).toEqual({ minutes: 10, seconds: 0 });
        expect(splitDuration(4530)).toEqual({ minutes: 75, seconds: 30 });
    });
});
