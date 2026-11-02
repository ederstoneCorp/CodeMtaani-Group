import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getOrganisationalAnalytics } from "@/lib/dashboard-analytics";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const analytics = await getOrganisationalAnalytics();
    return NextResponse.json({ analytics }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
  }
}
