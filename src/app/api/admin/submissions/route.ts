import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSubmissions } from "@/lib/admin-submissions";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const q = request.nextUrl.searchParams;
    const data = await getSubmissions({ type: q.get("type") || "", status: q.get("status") || "", search: q.get("q") || "" });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin submissions query failed:", error);
    return NextResponse.json({ error: "Unable to load submissions." }, { status: 503 });
  }
}
