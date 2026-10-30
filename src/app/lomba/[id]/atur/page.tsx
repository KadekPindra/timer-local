import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CompetitionEditor from "@/components/CompetitionEditor";
import EditorSkeleton from "@/components/EditorSkeleton";
import { CompetitionIdSchema } from "@/lib/schema";

export const metadata: Metadata = { title: "Atur Timer — ITCC 2026" };

async function Gate({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!CompetitionIdSchema.safeParse(id).success) notFound();
    return <CompetitionEditor id={id} />;
}

export default function AturPage({ params }: PageProps<"/lomba/[id]/atur">) {
    return (
        <Suspense fallback={<EditorSkeleton />}>
            <Gate params={params} />
        </Suspense>
    );
}
