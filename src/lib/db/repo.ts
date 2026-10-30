import "server-only";
import { nanoid } from "nanoid";
import { toCompetition } from "../competition-doc";
import { LIMITS, type Competition, type CompetitionInput } from "../schema";
import { getDb } from "./db";

type Row = {
    id: string;
    name: string;
    category: string;
    sessions: string;
};

function parseSessions(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

function fromRow(row: Row): Competition {
    return toCompetition(row.id, {
        name: row.name,
        category: row.category,
        sessions: parseSessions(row.sessions),
    });
}

export function listCompetitions(): Competition[] {
    const rows = getDb()
        .prepare(
            "SELECT id, name, category, sessions FROM competitions ORDER BY created_at ASC, rowid ASC",
        )
        .all() as Row[];
    return rows.map(fromRow);
}

export function getCompetition(id: string): Competition | null {
    const row = getDb()
        .prepare("SELECT id, name, category, sessions FROM competitions WHERE id = ?")
        .get(id) as Row | undefined;
    return row ? fromRow(row) : null;
}

export function countCompetitions(): number {
    const row = getDb().prepare("SELECT COUNT(*) AS total FROM competitions").get() as {
        total: number;
    };
    return row.total;
}

export function insertCompetition({ name, category, sessions }: CompetitionInput): string {
    const id = nanoid(20);
    const now = Date.now();
    getDb()
        .prepare(
            "INSERT INTO competitions (id, name, category, sessions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(id, name, category, JSON.stringify(sessions), now, now);
    return id;
}

export function updateCompetition(
    id: string,
    { name, category, sessions }: CompetitionInput,
): boolean {
    const result = getDb()
        .prepare(
            "UPDATE competitions SET name = ?, category = ?, sessions = ?, updated_at = ? WHERE id = ?",
        )
        .run(name, category, JSON.stringify(sessions), Date.now(), id);
    return result.changes > 0;
}

export function deleteCompetition(id: string): boolean {
    return getDb().prepare("DELETE FROM competitions WHERE id = ?").run(id).changes > 0;
}

function uniqueName(name: string, taken: Set<string>): string {
    if (!taken.has(name)) return name;
    for (let n = 2; ; n++) {
        const suffix = ` (${n})`;
        const candidate = name.slice(0, LIMITS.competitionName.max - suffix.length) + suffix;
        if (!taken.has(candidate)) return candidate;
    }
}

export function importCompetitions(items: CompetitionInput[]): {
    imported: number;
    renamed: string[];
} {
    const db = getDb();
    const renamed: string[] = [];

    db.exec("BEGIN IMMEDIATE");
    try {
        const taken = new Map<string, Set<string>>();
        const existing = db.prepare("SELECT name, category FROM competitions").all() as {
            name: string;
            category: string;
        }[];
        for (const { name, category } of existing) {
            if (!taken.has(category)) taken.set(category, new Set());
            taken.get(category)!.add(name);
        }

        for (const item of items) {
            const names = taken.get(item.category) ?? new Set<string>();
            taken.set(item.category, names);
            const name = uniqueName(item.name, names);
            names.add(name);
            if (name !== item.name) renamed.push(name);
            insertCompetition({ ...item, name });
        }
        db.exec("COMMIT");
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
    return { imported: items.length, renamed };
}
