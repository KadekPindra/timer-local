// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    computeFingerprint,
    isNodeSupported,
    mergeNodeOptions,
    nodeTooOldMessage,
    openCommand,
    pickPort,
    scanFiles,
} from "./lib.mjs";

describe("isNodeSupported", () => {
    it("menerima versi >= 22.13.0", () => {
        expect(isNodeSupported("22.13.0")).toBe(true);
        expect(isNodeSupported("22.13.1")).toBe(true);
        expect(isNodeSupported("22.20.0")).toBe(true);
        expect(isNodeSupported("24.18.0")).toBe(true);
        expect(isNodeSupported("v26.0.0")).toBe(true);
    });

    it("menolak versi lebih lama", () => {
        expect(isNodeSupported("22.12.9")).toBe(false);
        expect(isNodeSupported("22.0.0")).toBe(false);
        expect(isNodeSupported("20.19.0")).toBe(false);
        expect(isNodeSupported("18.20.4")).toBe(false);
    });

    it("pesan versi berbahasa Indonesia dan menyebut versi pengguna", () => {
        const message = nodeTooOldMessage("20.11.1");
        expect(message).toContain("Node.js kamu versi 20.11.1");
        expect(message).toContain("Node.js 24 LTS");
        expect(message).toContain("npm start");
    });
});

describe("mergeNodeOptions", () => {
    it("menambah opsi ke NODE_OPTIONS yang ada", () => {
        expect(
            mergeNodeOptions("--max-old-space-size=4096", "--disable-warning=ExperimentalWarning"),
        ).toBe("--max-old-space-size=4096 --disable-warning=ExperimentalWarning");
    });

    it("tidak menggandakan dan menangani nilai kosong", () => {
        expect(mergeNodeOptions(undefined, "--a")).toBe("--a");
        expect(mergeNodeOptions("--a", "--a")).toBe("--a");
    });
});

describe("computeFingerprint", () => {
    const base = { packageVersion: "1.0.0", lockfile: "{}", newestMtimeMs: 1000.7, fileCount: 10 };

    it("stabil untuk masukan yang sama", () => {
        expect(computeFingerprint(base)).toBe(computeFingerprint({ ...base }));
    });

    it("berubah kalau versi, lockfile, mtime, atau jumlah berkas berubah", () => {
        const original = computeFingerprint(base);
        expect(computeFingerprint({ ...base, packageVersion: "1.0.1" })).not.toBe(original);
        expect(computeFingerprint({ ...base, lockfile: "{a}" })).not.toBe(original);
        expect(computeFingerprint({ ...base, newestMtimeMs: 2000 })).not.toBe(original);
        expect(computeFingerprint({ ...base, fileCount: 9 })).not.toBe(original);
    });
});

describe("scanFiles", () => {
    it("mengembalikan mtime terbaru dan jumlah berkas, melewati path yang tidak ada", () => {
        const dir = mkdtempSync(path.join(tmpdir(), "itcc-scan-"));
        try {
            mkdirSync(path.join(dir, "sub"));
            writeFileSync(path.join(dir, "a.txt"), "a");
            writeFileSync(path.join(dir, "sub", "b.txt"), "b");
            utimesSync(path.join(dir, "a.txt"), 1000, 1000);
            utimesSync(path.join(dir, "sub", "b.txt"), 5000, 5000);

            const result = scanFiles([dir, path.join(dir, "tidak-ada")]);
            expect(result.fileCount).toBe(2);
            expect(result.newestMtimeMs).toBe(5000 * 1000);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe("openCommand", () => {
    it("memilih perintah sesuai OS", () => {
        expect(openCommand("win32", "http://localhost:3000").command).toBe("cmd");
        expect(openCommand("darwin", "http://localhost:3000").command).toBe("open");
        expect(openCommand("linux", "http://localhost:3000")).toEqual({
            command: "xdg-open",
            args: ["http://localhost:3000"],
        });
    });
});

describe("pickPort", () => {
    it("memakai port pertama yang kosong", async () => {
        expect(await pickPort(3000, async () => true)).toBe(3000);
        expect(await pickPort(3000, async (port) => port >= 3001)).toBe(3001);
    });

    it("null kalau semua terpakai", async () => {
        expect(await pickPort(3000, async () => false)).toBeNull();
    });
});
