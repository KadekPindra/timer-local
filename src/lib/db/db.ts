import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 1;

const globalForDb = globalThis as typeof globalThis & { __itccTimerDb?: DatabaseSync };

function dbPath(): string {
    return process.env.TIMER_DB_PATH ?? path.join(process.cwd(), "data", "timer.db");
}

function migrate(db: DatabaseSync): void {
    const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
    if (row.user_version >= SCHEMA_VERSION) return;

    db.exec("BEGIN IMMEDIATE");
    try {
        if (row.user_version < 1) {
            db.exec(`
                CREATE TABLE IF NOT EXISTS competitions (
                    id         TEXT PRIMARY KEY,
                    name       TEXT NOT NULL,
                    category   TEXT NOT NULL,
                    sessions   TEXT NOT NULL DEFAULT '[]',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS competitions_created_at ON competitions(created_at);
            `);
        }
        db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
        db.exec("COMMIT");
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}

export function getDb(): DatabaseSync {
    if (globalForDb.__itccTimerDb) return globalForDb.__itccTimerDb;

    const file = dbPath();
    if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });

    const db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 3000");
    db.exec("PRAGMA foreign_keys = ON");
    migrate(db);

    globalForDb.__itccTimerDb = db;
    return db;
}

/** Menutup koneksi singleton. Dipakai test supaya tiap test mulai dari DB baru. */
export function closeDb(): void {
    globalForDb.__itccTimerDb?.close();
    globalForDb.__itccTimerDb = undefined;
}
