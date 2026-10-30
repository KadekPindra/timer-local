import { describe, expect, it } from "vitest";
import { planRing, splitIntoClips } from "./bell-plan";

describe("splitIntoClips", () => {
    it("1–3× memakai satu rekaman yang sesuai", () => {
        expect(splitIntoClips(1)).toEqual([1]);
        expect(splitIntoClips(2)).toEqual([2]);
        expect(splitIntoClips(3)).toEqual([3]);
    });

    it("4× dan 5× dirangkai tanpa sisa satu dentang di akhir", () => {
        expect(splitIntoClips(4)).toEqual([2, 2]);
        expect(splitIntoClips(5)).toEqual([3, 2]);
        expect(splitIntoClips(7)).toEqual([3, 2, 2]);
    });

    it("0× atau negatif tidak berbunyi", () => {
        expect(splitIntoClips(0)).toEqual([]);
        expect(splitIntoClips(-2)).toEqual([]);
    });
});

describe("planRing", () => {
    it("kelompok berikutnya mulai 1 detik setelah kelompok sebelumnya", () => {
        expect(planRing(2)).toEqual([{ clip: 2, at: 0 }]);
        expect(planRing(5)).toEqual([
            { clip: 3, at: 0 },
            { clip: 2, at: 1 },
        ]);
    });
});
