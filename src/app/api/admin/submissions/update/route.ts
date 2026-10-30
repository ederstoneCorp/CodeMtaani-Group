import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateSubmission } from "@/lib/admin-submissions";
export const runtime = "nodejs";
const statuses = ["new", "reviewing", "responded", "closed", "rejected"];
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    const notes = String(body.internal_notes || "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.includes(status) || notes.length > 5000) {
      return NextResponse.json({ error: "Invalid update." }, { status: 400 });
    }
    const updated = await updateSubmission(id, status, notes);
    if (!updated) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update submission." }, { status: 503 });
  }
}
