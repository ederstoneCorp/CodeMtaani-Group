import { NextResponse } from "next/server";
import { getCodeMtaaniRepos } from "@/lib/github";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const repos = await getCodeMtaaniRepos();
  return NextResponse.json({ repos }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
}
