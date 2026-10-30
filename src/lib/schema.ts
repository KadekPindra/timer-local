import { nanoid } from "nanoid";
import { z } from "zod";

export const TONES = ["blue", "orange", "red"] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
    blue: "Biru",
    orange: "Oranye",
    red: "Merah",
};

export const CATEGORIES = ["mahasiswa", "sma-smk", "sd-smp", "umum"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
    mahasiswa: "Mahasiswa",
    "sma-smk": "SMA/SMK",
    "sd-smp": "SD/SMP",
    umum: "Umum",
};

export const LIMITS = {
    competitionName: { min: 2, max: 60 },
    sessionName: { min: 1, max: 40 },
    durationSec: { min: 1, max: 10800 },
    bellCount: { min: 0, max: 5 },
    bellsPerSession: 10,
    sessions: 10,
} as const;

export const MAX_COMPETITIONS = 100;

const IdSchema = z.string().min(1).max(32);

export const BellSchema = z.object({
    id: IdSchema,
    atSec: z.int().min(0),
    count: z.int().min(LIMITS.bellCount.min).max(LIMITS.bellCount.max),
    tone: z.enum(TONES),
});
export type Bell = z.infer<typeof BellSchema>;

export const SessionSchema = z
    .object({
        id: IdSchema,
        name: z
            .string()
            .trim()
            .min(LIMITS.sessionName.min, "Nama sesi wajib diisi.")
            .max(LIMITS.sessionName.max, `Nama sesi maksimal ${LIMITS.sessionName.max} karakter.`),
        durationSec: z
            .int()
            .min(LIMITS.durationSec.min, "Durasi minimal 1 detik.")
            .max(LIMITS.durationSec.max, "Durasi maksimal 180 menit."),
        bells: z
            .array(BellSchema)
            .max(LIMITS.bellsPerSession, `Maksimal ${LIMITS.bellsPerSession} lonceng per sesi.`),
    })
    .superRefine((session, ctx) => {
        const finals = session.bells.filter((b) => b.atSec === 0);
        if (finals.length !== 1) {
            ctx.addIssue({
                code: "custom",
                path: ["bells"],
                message: "Wajib ada tepat satu lonceng saat waktu habis (00:00).",
            });
        } else if (finals[0].tone !== "red") {
            ctx.addIssue({
                code: "custom",
                path: ["bells"],
                message: "Lonceng saat waktu habis harus berwarna merah.",
            });
        }

        const seen = new Set<number>();
        session.bells.forEach((bell, i) => {
            if (bell.atSec >= session.durationSec) {
                ctx.addIssue({
                    code: "custom",
                    path: ["bells", i, "atSec"],
                    message: "Harus lebih kecil dari durasi sesi.",
                });
            }
            if (seen.has(bell.atSec)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["bells", i, "atSec"],
                    message: "Waktu lonceng tidak boleh sama dengan lonceng lain.",
                });
            }
            seen.add(bell.atSec);
        });
    });
export type Session = z.infer<typeof SessionSchema>;

export const CompetitionNameSchema = z
    .string()
    .trim()
    .min(LIMITS.competitionName.min, "Nama lomba minimal 2 karakter.")
    .max(LIMITS.competitionName.max, `Nama lomba maksimal ${LIMITS.competitionName.max} karakter.`);

export const CompetitionInputSchema = z
    .object({
        name: CompetitionNameSchema,
        category: z.enum(CATEGORIES, "Pilih kategori."),
        sessions: z.array(SessionSchema).max(LIMITS.sessions, `Maksimal ${LIMITS.sessions} sesi.`),
    })
    .superRefine((input, ctx) => {
        const ids = new Set<string>();
        input.sessions.forEach((session, i) => {
            if (ids.has(session.id)) {
                ctx.addIssue({ code: "custom", path: ["sessions", i], message: "ID sesi ganda." });
            }
            ids.add(session.id);
        });
    });
export type CompetitionInput = z.infer<typeof CompetitionInputSchema>;

export type Competition = CompetitionInput & { id: string };

export const CompetitionIdSchema = z.string().regex(/^[A-Za-z0-9]{1,40}$/);

export const CreateCompetitionSchema = z.object({
    name: CompetitionNameSchema,
    category: z.enum(CATEGORIES, "Pilih kategori."),
});
export type CreateCompetitionInput = z.infer<typeof CreateCompetitionSchema>;

export function newBell(atSec: number, count: number, tone: Tone): Bell {
    return { id: nanoid(10), atSec, count, tone };
}

export function newSession(name = "Sesi baru", durationSec = 300): Session {
    return { id: nanoid(10), name, durationSec, bells: [newBell(0, 2, "red")] };
}

export function nextSessionName(name: string): string {
    const match = /^(.*?)(\d+)$/.exec(name);
    const next = match
        ? `${match[1]}${String(Number(match[2]) + 1).padStart(match[2].length, "0")}`
        : `${name} 2`;
    return next.slice(0, LIMITS.sessionName.max);
}

export function duplicateSession(session: Session): Session {
    return {
        ...session,
        id: nanoid(10),
        name: nextSessionName(session.name),
        bells: session.bells.map((bell) => ({ ...bell, id: nanoid(10) })),
    };
}

export function totalDurationSec(sessions: Session[]): number {
    return sessions.reduce((sum, s) => sum + s.durationSec, 0);
}
