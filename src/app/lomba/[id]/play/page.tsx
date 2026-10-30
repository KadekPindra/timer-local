import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TimerScreen from "@/components/TimerScreen";
import { CompetitionIdSchema } from "@/lib/schema";

export const metadata: Metadata = { title: "Layar Timer — ITCC 2026" };

async function Screen({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!CompetitionIdSchema.safeParse(id).success) notFound();
    return <TimerScreen id={id} />;
}

export default function PlayPage({ params }: PageProps<"/lomba/[id]/play">) {
    return (
        <Suspense>
            <Screen params={params} />
        </Suspense>
    );
}
