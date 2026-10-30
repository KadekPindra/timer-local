import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

export const MIN_NODE = "22.13.0";

function parseVersion(version) {
    const [major = 0, minor = 0, patch = 0] = String(version)
        .replace(/^v/, "")
        .split(".")
        .map((part) => Number.parseInt(part, 10) || 0);
    return [major, minor, patch];
}

/** True kalau `version` >= `min` (format "22.13.0" atau "v22.13.0"). */
export function isNodeSupported(version, min = MIN_NODE) {
    const a = parseVersion(version);
    const b = parseVersion(min);
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] > b[i];
    }
    return true;
}

export function nodeTooOldMessage(version) {
    return [
        `Node.js kamu versi ${String(version).replace(/^v/, "")}, sedangkan aplikasi ini butuh Node.js ${MIN_NODE} atau lebih baru.`,
        "Install Node.js 24 LTS dari https://nodejs.org lalu jalankan ulang `npm start`.",
    ].join("\n");
}

/** Gabungkan opsi baru ke NODE_OPTIONS yang sudah ada tanpa menggandakan. */
export function mergeNodeOptions(existing, extra) {
    const parts = (existing ?? "").split(/\s+/).filter(Boolean);
    for (const option of extra.split(/\s+/).filter(Boolean)) {
        if (!parts.includes(option)) parts.push(option);
    }
    return parts.join(" ");
}

/** Sidik sederhana untuk memutuskan perlu build ulang atau tidak. */
export function computeFingerprint({ packageVersion, lockfile, newestMtimeMs, fileCount }) {
    return createHash("sha256")
        .update(JSON.stringify([packageVersion, lockfile, Math.floor(newestMtimeMs), fileCount]))
        .digest("hex");
}

/** Mtime terbaru dan jumlah berkas di bawah `dirs` (yang tidak ada dilewati). */
export function scanFiles(dirs) {
    let newestMtimeMs = 0;
    let fileCount = 0;

    const visit = (target) => {
        let stat;
        try {
            stat = statSync(target);
        } catch {
            return;
        }
        if (stat.isDirectory()) {
            for (const entry of readdirSync(target)) visit(path.join(target, entry));
            return;
        }
        fileCount += 1;
        newestMtimeMs = Math.max(newestMtimeMs, stat.mtimeMs);
    };

    dirs.forEach(visit);
    return { newestMtimeMs, fileCount };
}

export function openCommand(platform, url) {
    if (platform === "win32") return { command: "cmd", args: ["/c", "start", '""', url] };
    if (platform === "darwin") return { command: "open", args: [url] };
    return { command: "xdg-open", args: [url] };
}

/** Port pertama dalam rentang `start`..`start + tries - 1` yang lolos `isFree`. */
export async function pickPort(start, isFree, tries = 11) {
    for (let port = start; port < start + tries; port++) {
        if (await isFree(port)) return port;
    }
    return null;
}
