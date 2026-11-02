import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getDashboardStats } from "@/lib/dashboard-stats";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin stats failed:", error);
    return NextResponse.json({ error: "Unable to load dashboard statistics." }, { status: 500 });
  }
}
