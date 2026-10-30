import { describe, expect, it } from "vitest";
import {
    CompetitionInputSchema,
    duplicateSession,
    newBell,
    newSession,
    nextSessionName,
    SessionSchema,
    totalDurationSec,
    type Session,
} from "./schema";

function session(overrides: Partial<Session> = {}): Session {
    return {
        id: "s1",
        name: "Presentasi",
        durationSec: 600,
        bells: [
            { id: "b1", atSec: 300, count: 1, tone: "orange" },
            { id: "b0", atSec: 0, count: 2, tone: "red" },
        ],
        ...overrides,
    };
}

function issueMessages(result: ReturnType<typeof SessionSchema.safeParse>) {
    return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("SessionSchema", () => {
    it("menerima sesi yang valid", () => {
        expect(SessionSchema.safeParse(session()).success).toBe(true);
    });

    it("menerima sesi hasil newSession()", () => {
        expect(SessionSchema.safeParse(newSession()).success).toBe(true);
    });

    it("menolak sesi tanpa lonceng 00:00", () => {
        const result = SessionSchema.safeParse(
            session({ bells: [{ id: "b1", atSec: 300, count: 1, tone: "orange" }] }),
        );
        expect(issueMessages(result)).toContain(
            "Wajib ada tepat satu lonceng saat waktu habis (00:00).",
        );
    });

    it("menolak lonceng 00:00 yang tidak merah", () => {
        const result = SessionSchema.safeParse(
            session({ bells: [{ id: "b0", atSec: 0, count: 2, tone: "orange" }] }),
        );
        expect(issueMessages(result)).toContain("Lonceng saat waktu habis harus berwarna merah.");
    });

    it("menolak lonceng dengan atSec ≥ durasi", () => {
        const result = SessionSchema.safeParse(
            session({
                durationSec: 300,
                bells: [
                    { id: "b1", atSec: 300, count: 1, tone: "orange" },
                    { id: "b0", atSec: 0, count: 2, tone: "red" },
                ],
            }),
        );
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(["bells", 0, "atSec"]);
    });

    it("menolak atSec ganda", () => {
        const result = SessionSchema.safeParse(
            session({
                bells: [
                    { id: "b1", atSec: 60, count: 1, tone: "orange" },
                    { id: "b2", atSec: 60, count: 1, tone: "red" },
                    { id: "b0", atSec: 0, count: 2, tone: "red" },
                ],
            }),
        );
        expect(issueMessages(result)).toContain(
            "Waktu lonceng tidak boleh sama dengan lonceng lain.",
        );
    });

    it("menolak nama kosong, durasi di luar batas, dan jumlah bunyi > 5", () => {
        expect(SessionSchema.safeParse(session({ name: "   " })).success).toBe(false);
        expect(SessionSchema.safeParse(session({ durationSec: 0 })).success).toBe(false);
        expect(SessionSchema.safeParse(session({ durationSec: 10801 })).success).toBe(false);
        expect(
            SessionSchema.safeParse(
                session({ bells: [{ id: "b0", atSec: 0, count: 6, tone: "red" }] }),
            ).success,
        ).toBe(false);
    });

    it("menolak lebih dari 10 lonceng", () => {
        const bells = Array.from({ length: 11 }, (_, i) =>
            newBell(i * 10, 1, i === 0 ? "red" : "blue"),
        );
        expect(SessionSchema.safeParse(session({ bells })).success).toBe(false);
    });
});

describe("CompetitionInputSchema", () => {
    it("menerima lomba tanpa sesi", () => {
        expect(
            CompetitionInputSchema.safeParse({
                name: "Web Design",
                category: "mahasiswa",
                sessions: [],
            }).success,
        ).toBe(true);
    });

    it("menolak nama terlalu pendek, kategori asing, dan > 10 sesi", () => {
        const base = { name: "Web Design", category: "mahasiswa", sessions: [] };
        expect(CompetitionInputSchema.safeParse({ ...base, name: "A" }).success).toBe(false);
        expect(CompetitionInputSchema.safeParse({ ...base, category: "dosen" }).success).toBe(
            false,
        );
        const sessions = Array.from({ length: 11 }, () => newSession());
        expect(CompetitionInputSchema.safeParse({ ...base, sessions }).success).toBe(false);
    });

    it("menolak ID sesi ganda", () => {
        const s = newSession();
        expect(
            CompetitionInputSchema.safeParse({
                name: "Web Design",
                category: "umum",
                sessions: [s, { ...s }],
            }).success,
        ).toBe(false);
    });
});

describe("helper sesi", () => {
    it("newSession() membuat lonceng 00:00 merah 2×", () => {
        const s = newSession("Tanya Jawab", 300);
        expect(s).toMatchObject({ name: "Tanya Jawab", durationSec: 300 });
        expect(s.bells).toEqual([{ id: expect.any(String), atSec: 0, count: 2, tone: "red" }]);
    });

    it("nextSessionName() menaikkan angka di akhir nama", () => {
        expect(nextSessionName("Tanya Jawab Juri 1")).toBe("Tanya Jawab Juri 2");
        expect(nextSessionName("Sesi 09")).toBe("Sesi 10");
        expect(nextSessionName("Presentasi")).toBe("Presentasi 2");
        expect(nextSessionName("x".repeat(40))).toHaveLength(40);
    });

    it("duplicateSession() membuat id baru untuk sesi dan semua lonceng", () => {
        const original = session({ name: "Tanya Jawab Juri 1" });
        const copy = duplicateSession(original);
        expect(copy.name).toBe("Tanya Jawab Juri 2");
        expect(copy.id).not.toBe(original.id);
        expect(copy.durationSec).toBe(original.durationSec);
        copy.bells.forEach((bell, i) => {
            expect(bell.id).not.toBe(original.bells[i].id);
            expect(bell).toMatchObject({
                atSec: original.bells[i].atSec,
                count: original.bells[i].count,
                tone: original.bells[i].tone,
            });
        });
        expect(SessionSchema.safeParse(copy).success).toBe(true);
    });

    it("totalDurationSec() menjumlahkan durasi semua sesi", () => {
        expect(totalDurationSec([session(), session({ durationSec: 300 })])).toBe(900);
        expect(totalDurationSec([])).toBe(0);
    });
});
