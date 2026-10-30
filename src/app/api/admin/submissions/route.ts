import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { allowedTypes } from "@/lib/admin-roles";
import { getSubmissions } from "@/lib/admin-submissions";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const q = request.nextUrl.searchParams;
    const data = await getSubmissions({ type: q.get("type") || "", status: q.get("status") || "", search: q.get("q") || "", allowedTypes: allowedTypes(session) });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin submissions query failed:", error);
    return NextResponse.json({ error: "Unable to load submissions." }, { status: 503 });
  }
}
