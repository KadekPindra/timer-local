import { nanoid } from "nanoid";
import { z } from "zod";
import { CompetitionInputSchema, MAX_COMPETITIONS, type CompetitionInput } from "./schema";

export const TRANSFER_APP = "itcc-timer";
export const TRANSFER_VERSION = 1;

const TransferSchema = z.object({
    app: z.literal(TRANSFER_APP, "Berkas ini bukan hasil export Timer ITCC."),
    version: z.literal(TRANSFER_VERSION, "Versi berkas tidak didukung."),
    exportedAt: z.string().optional(),
    competitions: z
        .array(z.unknown(), "Daftar lomba tidak ditemukan di berkas.")
        .max(MAX_COMPETITIONS, `Maksimal ${MAX_COMPETITIONS} lomba.`),
});

export type Transfer = {
    app: typeof TRANSFER_APP;
    version: typeof TRANSFER_VERSION;
    exportedAt: string;
    competitions: CompetitionInput[];
};

export class TransferError extends Error {}

export function buildExport(
    competitions: CompetitionInput[],
    exportedAt: Date = new Date(),
): Transfer {
    return {
        app: TRANSFER_APP,
        version: TRANSFER_VERSION,
        exportedAt: exportedAt.toISOString(),
        competitions: competitions.map(({ name, category, sessions }) => ({
            name,
            category,
            sessions,
        })),
    };
}

/** Validasi isi berkas export. ID sesi dan lonceng dibuat ulang. */
export function parseImport(json: string): CompetitionInput[] {
    let raw: unknown;
    try {
        raw = JSON.parse(json);
    } catch {
        throw new TransferError("Berkas bukan JSON yang valid.");
    }

    const envelope = TransferSchema.safeParse(raw);
    if (!envelope.success) throw new TransferError(envelope.error.issues[0].message);

    return envelope.data.competitions.map((item, i) => {
        const parsed = CompetitionInputSchema.safeParse(item);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            const where = issue.path.length ? ` (${issue.path.join(".")})` : "";
            throw new TransferError(`Lomba ke-${i + 1} tidak valid${where}: ${issue.message}`);
        }
        const { name, category, sessions } = parsed.data;
        return {
            name,
            category,
            sessions: sessions.map((session) => ({
                ...session,
                id: nanoid(10),
                bells: session.bells.map((bell) => ({ ...bell, id: nanoid(10) })),
            })),
        };
    });
}

function slugify(text: string): string {
    const slug = text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "lomba";
}

/** `name` null = export semua lomba. */
export function exportFileName(name: string | null, date: Date = new Date()): string {
    if (name !== null) return `${TRANSFER_APP}_${slugify(name)}.json`;
    return `${TRANSFER_APP}_semua_${date.toISOString().slice(0, 10)}.json`;
}
