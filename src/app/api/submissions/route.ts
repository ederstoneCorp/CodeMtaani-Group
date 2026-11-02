import { NextRequest, NextResponse } from "next/server";
import { createPublicSubmission, type PublicSubmission } from "@/lib/public-submissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

const validTypes = ["idea", "proposal", "partnership", "community", "suggestion"];

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimitResult = await checkRateLimit(`submission:${ip}`, 5, 60);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    const title = String(body.title || "").trim();
    const name = String(body.submitter_name || body.name || "").trim();
    const email = String(body.submitter_email || body.email || "").trim().toLowerCase();
    const description = String(body.description || body.message || "").trim();
    const submissionType = String(body.submission_type || "idea");

    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Please provide a valid title." }, { status: 400 });
    }
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!description || description.length < 20 || description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be between 20 and 5,000 characters." },
        { status: 400 }
      );
    }
    if (!validTypes.includes(submissionType)) {
      return NextResponse.json({ error: "Invalid submission category." }, { status: 400 });
    }

    const submission = await createPublicSubmission({
      submission_type: submissionType as PublicSubmission["submission_type"],
      title,
      submitter_name: name,
      submitter_email: email,
      organisation: body.organisation ? String(body.organisation).trim() : null,
      description,
      attachment_url: body.attachment_url || null,
    });

    // Notify all admins in notification center
    await createNotification({
      title: `New Innovation Submission: ${title}`,
      message: `${name} submitted a ${submissionType} (Ref: ${submission.reference_number}).`,
      category: "application",
      link: `/admin?tab=submissions&ref=${submission.reference_number}`,
    });

    return NextResponse.json(
      {
        ok: true,
        reference_number: submission.reference_number,
        status: submission.status,
        message: "Your submission has been securely registered with CodeMtaani Group.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public submission failed:", error);
    return NextResponse.json({ error: "Unable to process submission." }, { status: 500 });
  }
}
