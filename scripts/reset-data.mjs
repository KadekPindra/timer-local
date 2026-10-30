import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = process.env.TIMER_DB_PATH ?? path.join(root, "data", "timer.db");
const files = [dbFile, `${dbFile}-wal`, `${dbFile}-shm`];

if (!files.some((file) => existsSync(file))) {
    console.log("Tidak ada data yang perlu dihapus.");
    process.exit(0);
}

console.log(`Semua lomba di ${dbFile} akan dihapus permanen.`);
console.log("Tip: jalankan Export Semua di aplikasi dulu kalau datanya mau disimpan.");
console.log("Pastikan aplikasi (npm start) sudah ditutup.");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question("Hapus semua data? (y/N) ")).trim().toLowerCase();
rl.close();

if (answer !== "y") {
    console.log("Dibatalkan. Data tidak diubah.");
    process.exit(0);
}

try {
    for (const file of files) rmSync(file, { force: true });
} catch (error) {
    console.error(`Gagal menghapus data: ${error.message}\nTutup aplikasi dulu, lalu coba lagi.`);
    process.exit(1);
}
console.log("Data dihapus. Jalankan `npm start` untuk mulai dari nol.");
