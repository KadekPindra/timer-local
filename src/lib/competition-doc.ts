import {
    CATEGORIES,
    CompetitionInputSchema,
    type Category,
    type Competition,
    type CompetitionInput,
} from "./schema";

export function toCompetition(id: string, data: Record<string, unknown> | undefined): Competition {
    const parsed = CompetitionInputSchema.safeParse(data);
    if (parsed.success) return { id, ...parsed.data };

    const category = CATEGORIES.includes(data?.category as Category)
        ? (data?.category as Category)
        : "umum";
    const name = typeof data?.name === "string" && data.name.trim() ? data.name : "Tanpa nama";
    return { id, name, category, sessions: [] };
}

export function toInput({ name, category, sessions }: Competition): CompetitionInput {
    return { name, category, sessions };
}

function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
        );
    }
    return value;
}

export function sameContent(a: unknown, b: unknown): boolean {
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}
