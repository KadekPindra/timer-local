import { describe, expect, it } from "vitest";
import { newSession, type CompetitionInput } from "./schema";
import { buildExport, exportFileName, parseImport, TransferError } from "./transfer";

function comp(overrides: Partial<CompetitionInput> = {}): CompetitionInput {
    return {
        name: "Web Design",
        category: "mahasiswa",
        sessions: [newSession("Presentasi", 600)],
        ...overrides,
    };
}

function stripIds(items: CompetitionInput[]) {
    return JSON.parse(JSON.stringify(items), (key, value) => (key === "id" ? undefined : value));
}

function parseError(json: string): string {
    try {
        parseImport(json);
    } catch (error) {
        expect(error).toBeInstanceOf(TransferError);
        return (error as Error).message;
    }
    throw new Error("parseImport seharusnya gagal");
}

describe("buildExport → parseImport", () => {
    it("menghasilkan data yang sama kecuali ID", () => {
        const source = [comp(), comp({ name: "UI/UX", category: "umum", sessions: [] })];
        const file = JSON.stringify(buildExport(source));
        const result = parseImport(file);
        expect(stripIds(result)).toEqual(stripIds(source));
        expect(result[0].sessions[0].id).not.toBe(source[0].sessions[0].id);
        expect(result[0].sessions[0].bells[0].id).not.toBe(source[0].sessions[0].bells[0].id);
    });

    it("amplop export berisi app, version, dan exportedAt; ID lomba tidak ikut", () => {
        const date = new Date("2026-10-30T13:40:00.000Z");
        const out = buildExport([{ ...comp(), id: "abc" } as CompetitionInput], date);
        expect(out).toMatchObject({
            app: "itcc-timer",
            version: 1,
            exportedAt: "2026-10-30T13:40:00.000Z",
        });
        expect(out.competitions[0]).not.toHaveProperty("id");
    });
});

describe("parseImport menolak", () => {
    const valid = () => buildExport([comp()]);

    it("JSON rusak", () => {
        expect(parseError("{bukan json")).toBe("Berkas bukan JSON yang valid.");
    });

    it("app yang salah", () => {
        expect(parseError(JSON.stringify({ ...valid(), app: "lain" }))).toContain(
            "bukan hasil export",
        );
    });

    it("version yang salah", () => {
        expect(parseError(JSON.stringify({ ...valid(), version: 2 }))).toContain("Versi");
    });

    it("lebih dari 100 lomba", () => {
        const many = { ...valid(), competitions: Array.from({ length: 101 }, () => comp()) };
        expect(parseError(JSON.stringify(many))).toContain("Maksimal 100");
    });

    it("sesi tanpa lonceng 00:00", () => {
        const session = newSession("Presentasi", 600);
        session.bells = [];
        const file = buildExport([comp({ sessions: [session] })]);
        const message = parseError(JSON.stringify(file));
        expect(message).toContain("Lomba ke-1");
        expect(message).toContain("lonceng saat waktu habis");
    });
});

describe("exportFileName", () => {
    it("per lomba memakai slug nama", () => {
        expect(exportFileName("Web Design 2026!")).toBe("itcc-timer_web-design-2026.json");
        expect(exportFileName("Éssai Ünik")).toBe("itcc-timer_essai-unik.json");
        expect(exportFileName("!!!")).toBe("itcc-timer_lomba.json");
    });

    it("semua lomba memakai tanggal", () => {
        expect(exportFileName(null, new Date("2026-10-30T10:00:00Z"))).toBe(
            "itcc-timer_semua_2026-10-30.json",
        );
    });
});
