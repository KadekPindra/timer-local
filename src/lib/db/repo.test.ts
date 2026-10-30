// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sameContent, toInput } from "../competition-doc";
import { newSession, type CompetitionInput } from "../schema";
import { closeDb, getDb } from "./db";
import {
    countCompetitions,
    deleteCompetition,
    getCompetition,
    importCompetitions,
    insertCompetition,
    listCompetitions,
    updateCompetition,
} from "./repo";

function input(overrides: Partial<CompetitionInput> = {}): CompetitionInput {
    return {
        name: "Web Design",
        category: "mahasiswa",
        sessions: [newSession("Presentasi", 600), newSession("Tanya Jawab", 300)],
        ...overrides,
    };
}

beforeEach(() => {
    process.env.TIMER_DB_PATH = ":memory:";
});

afterEach(() => {
    closeDb();
    delete process.env.TIMER_DB_PATH;
});

describe("migrasi", () => {
    it("idempoten: user_version tetap 1 dan data utuh setelah DB dibuka dua kali", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "itcc-db-"));
        process.env.TIMER_DB_PATH = path.join(dir, "sub", "timer.db");
        try {
            const userVersion = () =>
                (getDb().prepare("PRAGMA user_version").get() as { user_version: number })
                    .user_version;
            expect(userVersion()).toBe(1);
            const id = insertCompetition(input());
            closeDb();
            expect(userVersion()).toBe(1);
            expect(getCompetition(id)).not.toBeNull();
        } finally {
            closeDb();
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe("CRUD", () => {
    it("insert → get: sessions bolak-balik JSON tetap sama", () => {
        const data = input();
        const id = insertCompetition(data);
        expect(id).toMatch(/^[A-Za-z0-9_-]{20}$/);
        const found = getCompetition(id)!;
        expect(found.id).toBe(id);
        expect(sameContent(toInput(found), data)).toBe(true);
    });

    it("get mengembalikan null kalau tidak ada", () => {
        expect(getCompetition("tidakada")).toBeNull();
    });

    it("list diurutkan menurut waktu dibuat dan count sesuai", () => {
        const a = insertCompetition(input({ name: "A lomba" }));
        const b = insertCompetition(input({ name: "B lomba" }));
        const c = insertCompetition(input({ name: "C lomba" }));
        expect(listCompetitions().map((x) => x.id)).toEqual([a, b, c]);
        expect(countCompetitions()).toBe(3);
    });

    it("update mengubah isi, false kalau id tidak ada", () => {
        const id = insertCompetition(input());
        const next = input({ name: "UI/UX", category: "umum", sessions: [] });
        expect(updateCompetition(id, next)).toBe(true);
        expect(sameContent(toInput(getCompetition(id)!), next)).toBe(true);
        expect(updateCompetition("tidakada", next)).toBe(false);
    });

    it("delete menghapus, false kalau id tidak ada", () => {
        const id = insertCompetition(input());
        expect(deleteCompetition(id)).toBe(true);
        expect(getCompetition(id)).toBeNull();
        expect(deleteCompetition(id)).toBe(false);
    });

    it("id yang mengandung SQL diperlakukan sebagai data", () => {
        insertCompetition(input());
        expect(getCompetition("x' OR '1'='1")).toBeNull();
        expect(deleteCompetition("x' OR '1'='1")).toBe(false);
        expect(countCompetitions()).toBe(1);
    });
});

describe("data rusak", () => {
    it("kolom sessions rusak tetap terbaca lewat fallback, tanpa crash", () => {
        const id = insertCompetition(input({ name: "Rusak" }));
        getDb().prepare("UPDATE competitions SET sessions = ? WHERE id = ?").run("{bukan json", id);
        expect(getCompetition(id)).toEqual({
            id,
            name: "Rusak",
            category: "mahasiswa",
            sessions: [],
        });
        expect(listCompetitions()).toHaveLength(1);
    });

    it("sessions yang tidak lolos skema juga jatuh ke fallback", () => {
        const id = insertCompetition(input());
        getDb()
            .prepare("UPDATE competitions SET sessions = ?, category = ? WHERE id = ?")
            .run(JSON.stringify([{ id: "x" }]), "aneh", id);
        expect(getCompetition(id)).toMatchObject({ category: "umum", sessions: [] });
    });
});

describe("importCompetitions", () => {
    it("nama + kategori ganda diberi akhiran (2), (3), tanpa menimpa yang ada", () => {
        insertCompetition(input());
        const result = importCompetitions([input(), input(), input({ category: "umum" })]);
        expect(result).toEqual({ imported: 3, renamed: ["Web Design (2)", "Web Design (3)"] });
        expect(listCompetitions().map((c) => `${c.name}|${c.category}`)).toEqual([
            "Web Design|mahasiswa",
            "Web Design (2)|mahasiswa",
            "Web Design (3)|mahasiswa",
            "Web Design|umum",
        ]);
    });

    it("akhiran tidak membuat nama melebihi batas", () => {
        const name = "x".repeat(60);
        importCompetitions([input({ name }), input({ name })]);
        const names = listCompetitions().map((c) => c.name);
        expect(names[1]).toHaveLength(60);
        expect(names[1].endsWith(" (2)")).toBe(true);
    });

    it("kalau satu item gagal, semuanya di-rollback", () => {
        insertCompetition(input({ name: "Sudah ada" }));
        const bad = input({ name: "Rusak" });
        (bad as { sessions: unknown }).sessions = [{ boom: BigInt(1) }];
        expect(() => importCompetitions([input({ name: "Baik" }), bad])).toThrow();
        expect(listCompetitions().map((c) => c.name)).toEqual(["Sudah ada"]);
    });
});
