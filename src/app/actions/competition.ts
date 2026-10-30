"use server";

import { fieldErrorsOf, type ActionError, type ActionResult } from "@/lib/action-result";
import * as repo from "@/lib/db/repo";
import {
    CompetitionIdSchema,
    CompetitionInputSchema,
    CreateCompetitionSchema,
    MAX_COMPETITIONS,
    type CompetitionInput,
    type CreateCompetitionInput,
} from "@/lib/schema";
import { parseImport, TransferError } from "@/lib/transfer";

const NOT_FOUND: ActionError = { ok: false, code: "NOT_FOUND", error: "Lomba tidak ditemukan." };

const LIMIT_REACHED: ActionError = {
    ok: false,
    error: `Jumlah lomba sudah mencapai batas (${MAX_COMPETITIONS}). Hapus lomba yang tidak terpakai dulu.`,
};

function failure(error: unknown): ActionError {
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan di server. Coba lagi." };
}

export async function createCompetition(
    input: CreateCompetitionInput,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = CreateCompetitionSchema.safeParse(input);
        if (!parsed.success) {
            return {
                ok: false,
                error: "Periksa kembali isian formulir.",
                fieldErrors: fieldErrorsOf(parsed.error),
            };
        }
        if (repo.countCompetitions() >= MAX_COMPETITIONS) return LIMIT_REACHED;

        const id = repo.insertCompetition({ ...parsed.data, sessions: [] });
        return { ok: true, data: { id } };
    } catch (error) {
        return failure(error);
    }
}

export async function updateCompetition(
    competitionId: string,
    input: CompetitionInput,
): Promise<ActionResult> {
    try {
        const id = CompetitionIdSchema.safeParse(competitionId);
        if (!id.success) return NOT_FOUND;

        const parsed = CompetitionInputSchema.safeParse(input);
        if (!parsed.success) {
            return {
                ok: false,
                error: "Masih ada isian yang belum benar.",
                fieldErrors: fieldErrorsOf(parsed.error),
            };
        }

        return repo.updateCompetition(id.data, parsed.data) ? { ok: true, data: null } : NOT_FOUND;
    } catch (error) {
        return failure(error);
    }
}

export async function deleteCompetition(competitionId: string): Promise<ActionResult> {
    try {
        const id = CompetitionIdSchema.safeParse(competitionId);
        if (!id.success) return NOT_FOUND;
        return repo.deleteCompetition(id.data) ? { ok: true, data: null } : NOT_FOUND;
    } catch (error) {
        return failure(error);
    }
}

export async function importCompetitions(
    json: string,
): Promise<ActionResult<{ imported: number; renamed: string[] }>> {
    try {
        if (typeof json !== "string") return { ok: false, error: "Berkas tidak valid." };
        const items = parseImport(json);
        if (items.length === 0) return { ok: false, error: "Berkas tidak berisi lomba." };
        if (repo.countCompetitions() + items.length > MAX_COMPETITIONS) return LIMIT_REACHED;

        return { ok: true, data: repo.importCompetitions(items) };
    } catch (error) {
        if (error instanceof TransferError) return { ok: false, error: error.message };
        return failure(error);
    }
}
