import { connection } from "next/server";
import { getCompetition } from "@/lib/db/repo";
import { CompetitionIdSchema } from "@/lib/schema";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(_request: Request, { params }: RouteContext<"/api/competitions/[id]">) {
    await connection();
    const id = CompetitionIdSchema.safeParse((await params).id);
    const competition = id.success ? getCompetition(id.data) : null;
    if (!competition) {
        return Response.json(
            { error: "Lomba tidak ditemukan." },
            { status: 404, headers: NO_STORE },
        );
    }
    return Response.json(competition, { headers: NO_STORE });
}
