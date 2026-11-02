import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { canReviewSubmissions, audit } from "@/lib/admin-roles";
import { getAllPublicSubmissions, updatePublicSubmission } from "@/lib/public-submissions";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canReviewSubmissions(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const q = request.nextUrl.searchParams;
    const status = q.get("status") || undefined;
    const type = q.get("type") || undefined;
    const search = q.get("search") || undefined;

    const submissions = await getAllPublicSubmissions({ status, type, search });
    return NextResponse.json({ submissions }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Admin public submissions GET failed:", error);
    return NextResponse.json({ error: "Unable to load submissions." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canReviewSubmissions(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid submission ID." }, { status: 400 });
    }

    const updated = await updatePublicSubmission(id, {
      status: body.status,
      applicant_feedback: body.applicant_feedback,
      internal_notes: body.internal_notes,
      assigned_to: body.assigned_to,
    });

    if (!updated) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

    await audit(session, "public_submission_reviewed", "public_submission", id, {
      reference_number: updated.reference_number,
      status: updated.status,
      assigned_to: updated.assigned_to,
    });

    // Notify assigned staff if newly assigned
    if (body.assigned_to && body.assigned_to !== session.id) {
      await createNotification({
        recipientId: body.assigned_to,
        title: `Submission Assigned: ${updated.reference_number}`,
        message: `${session.fullName} assigned submission "${updated.title}" to you for technical review.`,
        category: "application",
        link: `/admin?tab=submissions&ref=${updated.reference_number}`,
      });
    }

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("Admin public submission update failed:", error);
    return NextResponse.json({ error: "Unable to update submission." }, { status: 500 });
  }
}
