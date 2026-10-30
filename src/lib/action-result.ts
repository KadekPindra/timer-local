import type { z } from "zod";

export type ActionError = {
    ok: false;
    error: string;
    code?: "NOT_FOUND";
    fieldErrors?: Record<string, string>;
};

export type ActionResult<T = null> = { ok: true; data: T } | ActionError;

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        out[issue.path.join(".")] ??= issue.message;
    }
    return out;
}
