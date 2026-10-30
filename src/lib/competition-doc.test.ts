import { describe, expect, it } from "vitest";
import { sameContent, toCompetition, toInput } from "./competition-doc";
import { newSession } from "./schema";

describe("toCompetition", () => {
    it("membaca dokumen valid dan membuang field tambahan", () => {
        const session = newSession("Presentasi", 600);
        expect(
            toCompetition("c1", {
                name: "Web Design",
                category: "mahasiswa",
                sessions: [session],
                createdAt: { seconds: 1 },
            }),
        ).toEqual({ id: "c1", name: "Web Design", category: "mahasiswa", sessions: [session] });
    });

    it("dokumen rusak tetap tampil tanpa sesi supaya tidak bisa di-Play", () => {
        expect(
            toCompetition("c2", { name: "Web Design", category: "sma-smk", sessions: [{ x: 1 }] }),
        ).toEqual({ id: "c2", name: "Web Design", category: "sma-smk", sessions: [] });
    });

    it("nama dan kategori asing diganti nilai aman", () => {
        expect(toCompetition("c3", { category: "dosen" })).toEqual({
            id: "c3",
            name: "Tanpa nama",
            category: "umum",
            sessions: [],
        });
        expect(toCompetition("c4", undefined)).toMatchObject({ name: "Tanpa nama" });
    });
});

describe("sameContent & toInput", () => {
    it("tidak peduli urutan key objek", () => {
        expect(
            sameContent(
                { name: "A", sessions: [{ id: "s", bells: [{ atSec: 0, id: "b" }] }] },
                { sessions: [{ bells: [{ id: "b", atSec: 0 }], id: "s" }], name: "A" },
            ),
        ).toBe(true);
    });

    it("peka terhadap urutan array dan nilai", () => {
        expect(sameContent({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
        expect(sameContent({ a: 1 }, { a: 2 })).toBe(false);
    });

    it("toInput membuang id lomba", () => {
        const session = newSession("Presentasi", 600);
        expect(
            toInput({ id: "c1", name: "Web Design", category: "umum", sessions: [session] }),
        ).toEqual({ name: "Web Design", category: "umum", sessions: [session] });
    });
});
