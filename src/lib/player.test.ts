import { describe, expect, it } from "vitest";
import { INITIAL_PLAYER, playerReducer, type PlayerAction, type PlayerState } from "./player";
import type { Competition, Session } from "./schema";
import { remainingMs, serializeRuntime } from "./timer-engine";

const presentasi: Session = {
    id: "s1",
    name: "Presentasi",
    durationSec: 600,
    bells: [
        { id: "b0", atSec: 0, count: 2, tone: "red" },
        { id: "b300", atSec: 300, count: 1, tone: "orange" },
    ],
};
const juri1: Session = {
    id: "s2",
    name: "Tanya Jawab Juri 1",
    durationSec: 300,
    bells: [{ id: "j0", atSec: 0, count: 2, tone: "red" }],
};
const juri2: Session = { ...juri1, id: "s3", name: "Tanya Jawab Juri 2" };

const competition: Competition = {
    id: "c1",
    name: "Web Design",
    category: "mahasiswa",
    sessions: [presentasi, juri1, juri2],
};

const EPOCH = 1_790_000_000_000;
const clock = { mono: 0, epoch: EPOCH };

function run(state: PlayerState, ...actions: PlayerAction[]): PlayerState {
    return actions.reduce(playerReducer, state);
}

const loaded = () => run(INITIAL_PLAYER, { type: "config", competition, clock });

describe("memuat konfigurasi", () => {
    it("mulai di sesi pertama, idle dengan durasi penuh", () => {
        const s = loaded();
        expect(s.sessionIndex).toBe(0);
        expect(s.runtime).toMatchObject({ status: "idle", durationMs: 600_000 });
    });

    it("lomba tanpa sesi tidak punya runtime dan tombol mulai tidak berefek", () => {
        const s = run(
            INITIAL_PLAYER,
            { type: "config", competition: { ...competition, sessions: [] }, clock },
            { type: "toggle", now: 1 },
        );
        expect(s.runtime).toBeNull();
    });

    it("memulihkan timer yang berjalan dari data tersimpan", () => {
        const before = run(
            loaded(),
            { type: "goTo", index: 1 },
            { type: "teamName", value: "Tim A" },
            {
                type: "toggle",
                now: 0,
            },
        );
        const saved = serializeRuntime(
            before.runtime!,
            { competitionId: "c1", sessionId: "s2", teamName: "Tim A" },
            { mono: 60_000, epoch: EPOCH },
        );
        const after = run(INITIAL_PLAYER, {
            type: "config",
            competition,
            saved,
            clock: { mono: 0, epoch: EPOCH + 10_000 },
        });
        expect(after.sessionIndex).toBe(1);
        expect(after.teamName).toBe("Tim A");
        expect(after.runtime?.status).toBe("running");
        expect(remainingMs(after.runtime!, 0)).toBe(230_000);
    });

    it("data tersimpan yang tidak valid diabaikan", () => {
        const s = run(INITIAL_PLAYER, {
            type: "config",
            competition,
            saved: { rusak: true },
            clock,
        });
        expect(s.runtime?.status).toBe("idle");
    });
});

describe("kontrol", () => {
    it("toggle memulai lalu menjeda", () => {
        let s = run(loaded(), { type: "toggle", now: 1_000 });
        expect(s.runtime?.status).toBe("running");
        s = run(s, { type: "toggle", now: 6_000 });
        expect(s.runtime?.status).toBe("paused");
        expect(remainingMs(s.runtime!, 99_000)).toBe(595_000);
    });

    it("reset kembali ke durasi penuh dan mengosongkan lonceng", () => {
        const s = run(
            loaded(),
            { type: "toggle", now: 0 },
            { type: "tick", now: 300_000 },
            { type: "reset" },
        );
        expect(s.runtime).toMatchObject({ status: "idle", firedBellIds: [] });
        expect(s.sessionIndex).toBe(0);
    });

    it("goTo pindah sesi dalam keadaan idle", () => {
        const s = run(loaded(), { type: "toggle", now: 0 }, { type: "goTo", index: 2 });
        expect(s.sessionIndex).toBe(2);
        expect(s.runtime).toMatchObject({ status: "idle", durationMs: 300_000 });
    });

    it("nextTeam kembali ke sesi 1 dan mengosongkan nama tim", () => {
        const s = run(
            loaded(),
            { type: "teamName", value: "Tim Kintamani" },
            { type: "goTo", index: 2 },
            { type: "toggle", now: 0 },
            { type: "nextTeam" },
        );
        expect(s.sessionIndex).toBe(0);
        expect(s.teamName).toBe("");
        expect(s.runtime).toMatchObject({ status: "idle", durationMs: 600_000 });
    });

    it("nama tim dibatasi 80 karakter", () => {
        expect(run(loaded(), { type: "teamName", value: "x".repeat(100) }).teamName).toHaveLength(
            80,
        );
    });
});

describe("lonceng saat tick", () => {
    it("tick tanpa lonceng baru mengembalikan state yang sama", () => {
        const s = run(loaded(), { type: "toggle", now: 0 });
        expect(playerReducer(s, { type: "tick", now: 1_000 })).toBe(s);
    });

    it("lonceng 05:00 menghasilkan satu bellEvent", () => {
        let s = run(loaded(), { type: "toggle", now: 0 }, { type: "tick", now: 300_000 });
        expect(s.bellEvent).toEqual({ bell: presentasi.bells[1], seq: 1 });
        s = run(s, { type: "tick", now: 300_500 });
        expect(s.bellEvent?.seq).toBe(1);
    });

    it("lompatan besar hanya membunyikan lonceng terakhir tapi menandai semuanya", () => {
        const s = run(loaded(), { type: "toggle", now: 0 }, { type: "tick", now: 605_000 });
        expect(s.bellEvent).toEqual({ bell: presentasi.bells[0], seq: 1 });
        expect(s.runtime?.firedBellIds).toEqual(["b300", "b0"]);
    });

    it("tick tidak berefek saat dijeda", () => {
        const s = run(loaded(), { type: "toggle", now: 0 }, { type: "toggle", now: 10_000 });
        expect(playerReducer(s, { type: "tick", now: 900_000 })).toBe(s);
    });
});

describe("konfigurasi berubah saat Play terbuka", () => {
    const longer: Competition = {
        ...competition,
        sessions: [{ ...presentasi, durationSec: 900 }, juri1, juri2],
    };

    it("saat idle: langsung dipakai", () => {
        const s = run(loaded(), { type: "config", competition: longer, clock });
        expect(s.runtime?.durationMs).toBe(900_000);
        expect(s.pending).toBeNull();
    });

    it("saat berjalan: dibekukan sampai reset", () => {
        let s = run(
            loaded(),
            { type: "toggle", now: 0 },
            { type: "config", competition: longer, clock },
        );
        expect(s.pending).toBe(longer);
        expect(s.runtime).toMatchObject({ status: "running", durationMs: 600_000 });

        s = run(s, { type: "reset" });
        expect(s.pending).toBeNull();
        expect(s.config).toBe(longer);
        expect(s.runtime).toMatchObject({ status: "idle", durationMs: 900_000 });
    });

    it("snapshot dengan isi sama tidak dianggap perubahan", () => {
        const s = run(loaded(), { type: "toggle", now: 0 });
        const next = run(s, { type: "config", competition: { ...competition }, clock });
        expect(next).toBe(s);
    });

    it("goTo saat ada perubahan tertunda mencari sesi yang sama berdasarkan id", () => {
        const reordered: Competition = { ...competition, sessions: [juri2, presentasi, juri1] };
        const s = run(
            loaded(),
            { type: "toggle", now: 0 },
            { type: "config", competition: reordered, clock },
            { type: "goTo", index: 1 },
        );
        expect(s.config).toBe(reordered);
        expect(s.sessionIndex).toBe(2);
        expect(s.config?.sessions[s.sessionIndex].id).toBe("s2");
    });

    it("sesi yang sedang dipilih dihapus saat idle → kembali ke sesi pertama", () => {
        const s = run(
            loaded(),
            { type: "goTo", index: 2 },
            {
                type: "config",
                competition: { ...competition, sessions: [presentasi, juri1] },
                clock,
            },
        );
        expect(s.sessionIndex).toBe(0);
    });
});
