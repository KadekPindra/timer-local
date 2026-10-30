"use client";

import { useState } from "react";
import { sameContent } from "@/lib/competition-doc";
import type { Competition } from "@/lib/schema";
import { useRefetchOnChange } from "./useRefetchOnChange";

export type CompetitionState = {
    data: Competition | null;
    loading: boolean;
    notFound: boolean;
    error: Error | null;
};

const INITIAL: CompetitionState = {
    data: null,
    loading: true,
    notFound: false,
    error: null,
};

export function useCompetition(id: string): CompetitionState {
    const [state, setState] = useState<CompetitionState>(INITIAL);

    useRefetchOnChange<Competition>(`/api/competitions/${encodeURIComponent(id)}`, (result) => {
        if (result.status === "ok") {
            setState((prev) => ({
                data: prev.data && sameContent(prev.data, result.data) ? prev.data : result.data,
                loading: false,
                notFound: false,
                error: null,
            }));
        } else if (result.status === "notFound") {
            setState({ ...INITIAL, loading: false, notFound: true });
        } else {
            setState((prev) => ({ ...prev, loading: false, error: result.error }));
        }
    });

    return state;
}
