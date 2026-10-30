import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    computeFingerprint,
    isNodeSupported,
    mergeNodeOptions,
    nodeTooOldMessage,
    openCommand,
    pickPort,
    scanFiles,
} from "./lib.mjs";

if (!isNodeSupported(process.versions.node)) {
    console.error(`\n${nodeTooOldMessage(process.versions.node)}\n`);
    process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const buildStamp = path.join(root, ".next", "itcc-build.json");
const HOST = "127.0.0.1";

if (!existsSync(nextBin)) {
    console.error("\nDependency belum terpasang. Jalankan `npm install` dulu, lalu `npm start`.\n");
    process.exit(1);
}

const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_OPTIONS: mergeNodeOptions(
        process.env.NODE_OPTIONS,
        "--disable-warning=ExperimentalWarning",
    ),
};

function currentFingerprint() {
    const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const lockPath = path.join(root, "package-lock.json");
    const sources = ["src", "public", "next.config.ts", "tsconfig.json", "postcss.config.mjs"].map(
        (name) => path.join(root, name),
    );
    return computeFingerprint({
        packageVersion: version,
        lockfile: existsSync(lockPath) ? readFileSync(lockPath, "utf8") : "",
        ...scanFiles(sources),
    });
}

function needsBuild(fingerprint) {
    if (!existsSync(path.join(root, ".next", "BUILD_ID"))) return true;
    try {
        return JSON.parse(readFileSync(buildStamp, "utf8")).fingerprint !== fingerprint;
    } catch {
        return true;
    }
}

function run(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [nextBin, ...args], {
            cwd: root,
            env,
            stdio: "inherit",
        });
        child.on("error", reject);
        child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    });
}

function isPortFree(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", () => resolve(false));
        server.listen(port, HOST, () => server.close(() => resolve(true)));
    });
}

async function waitUntilReady(url, child) {
    for (let attempt = 0; attempt < 120 && child.exitCode === null; attempt++) {
        try {
            if ((await fetch(url)).ok) return true;
        } catch {
            // server belum siap
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
}

function openBrowser(url) {
    const { command, args } = openCommand(process.platform, url);
    const opener = spawn(command, args, {
        stdio: "ignore",
        detached: true,
        windowsVerbatimArguments: true,
    });
    opener.on("error", () => console.log(`Buka manual di browser: ${url}`));
    opener.unref();
}

function banner(url) {
    const lines = [`Timer siap di ${url}`, "Jangan tutup jendela ini selama lomba."];
    const width = Math.max(...lines.map((line) => line.length)) + 4;
    const bar = "=".repeat(width);
    console.log(["", bar, ...lines.map((line) => `  ${line}`), bar, ""].join("\n"));
}

const fingerprint = currentFingerprint();
if (needsBuild(fingerprint)) {
    console.log("Menyiapkan aplikasi, ±1 menit (hanya pertama kali)…");
    try {
        await run(["build"]);
    } catch {
        console.error("\nBuild gagal. Pastikan `npm install` sudah selesai tanpa error.\n");
        process.exit(1);
    }
    writeFileSync(buildStamp, JSON.stringify({ fingerprint, builtAt: new Date().toISOString() }));
}

const requested = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;
const port = await pickPort(requested, isPortFree);
if (port === null) {
    console.error(
        `\nPort ${requested}–${requested + 10} semua terpakai. Tutup aplikasi lain lalu coba lagi.\n`,
    );
    process.exit(1);
}
if (port !== requested) console.log(`Port ${requested} terpakai, memakai port ${port}.`);

const server = spawn(process.execPath, [nextBin, "start", "-H", HOST, "-p", String(port)], {
    cwd: root,
    env,
    stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => process.exit(code ?? 0));

const url = `http://localhost:${port}`;
if (await waitUntilReady(`http://${HOST}:${port}/`, server)) {
    banner(url);
    if (process.env.NO_OPEN !== "1") openBrowser(url);
}
