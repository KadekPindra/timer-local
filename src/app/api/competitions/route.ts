import { connection } from "next/server";
import { listCompetitions } from "@/lib/db/repo";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
    await connection();
    return Response.json(listCompetitions(), { headers: NO_STORE });
}
