import { describe, expect, it } from "vitest";
import { formatClock, formatMinutes, formatMmSs, parseMmSs } from "./time";

describe("formatMmSs", () => {
    it("memformat detik jadi MM:SS", () => {
        expect(formatMmSs(600)).toBe("10:00");
        expect(formatMmSs(65)).toBe("01:05");
        expect(formatMmSs(0)).toBe("00:00");
    });

    it("mendukung durasi ≥ 60 menit", () => {
        expect(formatMmSs(4500)).toBe("75:00");
        expect(formatMmSs(10800)).toBe("180:00");
    });
});

describe("parseMmSs", () => {
    it("membaca MM:SS jadi detik", () => {
        expect(parseMmSs("10:00")).toBe(600);
        expect(parseMmSs("0:30")).toBe(30);
        expect(parseMmSs("75:00")).toBe(4500);
        expect(parseMmSs(" 05:09 ")).toBe(309);
    });

    it("menolak format yang salah", () => {
        expect(parseMmSs("10")).toBeNull();
        expect(parseMmSs("10:60")).toBeNull();
        expect(parseMmSs("10:5")).toBeNull();
        expect(parseMmSs("-1:00")).toBeNull();
        expect(parseMmSs("ab:cd")).toBeNull();
        expect(parseMmSs("")).toBeNull();
    });
});

describe("formatClock", () => {
    it("membulatkan sisa positif ke atas", () => {
        expect(formatClock(600000)).toBe("10:00");
        expect(formatClock(599001)).toBe("10:00");
        expect(formatClock(599000)).toBe("09:59");
        expect(formatClock(1)).toBe("00:01");
    });

    it("menampilkan 00:00 tepat saat habis", () => {
        expect(formatClock(0)).toBe("00:00");
    });

    it("menampilkan lebih waktu dengan tanda + dan pembulatan ke bawah", () => {
        expect(formatClock(-23400)).toBe("+00:23");
        expect(formatClock(-999)).toBe("+00:00");
        expect(formatClock(-61000)).toBe("+01:01");
    });
});

describe("formatMinutes", () => {
    it("menampilkan menit utuh atau desimal", () => {
        expect(formatMinutes(900)).toBe("15 menit");
        expect(formatMinutes(90)).toBe("1,5 menit");
    });
});
