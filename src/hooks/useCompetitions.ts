"use client";

import { useState } from "react";
import { sameContent } from "@/lib/competition-doc";
import type { Competition } from "@/lib/schema";
import { useRefetchOnChange } from "./useRefetchOnChange";

export type CompetitionsState = {
    data: Competition[];
    loading: boolean;
    error: Error | null;
};

export function useCompetitions(): CompetitionsState {
    const [state, setState] = useState<CompetitionsState>({
        data: [],
        loading: true,
        error: null,
    });

    useRefetchOnChange<Competition[]>("/api/competitions", (result) => {
        if (result.status === "ok") {
            setState((prev) => ({
                data: sameContent(prev.data, result.data) ? prev.data : result.data,
                loading: false,
                error: null,
            }));
        } else if (result.status === "error") {
            setState((prev) => ({ ...prev, loading: false, error: result.error }));
        }
    });

    return state;
}
