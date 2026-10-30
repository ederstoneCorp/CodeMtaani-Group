import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { allowedTypes, canEdit, audit } from "@/lib/admin-roles";
import { updateSubmission } from "@/lib/admin-submissions";
export const runtime = "nodejs";
const statuses = ["new", "reviewing", "responded", "closed", "rejected"];
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canEdit(session)) return NextResponse.json({ error: "Your account has read-only access." }, { status: 403 });
  try {
    const body = await request.json();
    const id = String(body.id || ""), status = String(body.status || ""), notes = String(body.internal_notes || "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.includes(status) || notes.length > 5000) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
    const updated = await updateSubmission(id, status, notes, allowedTypes(session));
    if (!updated) return NextResponse.json({ error: "Submission not found or outside your department access." }, { status: 404 });
    await audit(session, "submission_updated", "submission", id, { status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin submission update failed:", error);
    return NextResponse.json({ error: "Unable to update submission." }, { status: 503 });
  }
}
