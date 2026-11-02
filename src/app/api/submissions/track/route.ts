import { NextRequest, NextResponse } from "next/server";
import { getPublicSubmissionByRef } from "@/lib/public-submissions";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimitResult = await checkRateLimit(`track:${ip}`, 30, 60);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const q = request.nextUrl.searchParams;
  const ref = q.get("ref");

  if (!ref || ref.trim().length < 5) {
    return NextResponse.json({ error: "Reference number is required." }, { status: 400 });
  }

  try {
    const result = await getPublicSubmissionByRef(ref);
    if (!result) {
      return NextResponse.json(
        { error: "No submission found with this reference number. Please check and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { submission: result },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("Submission tracking error:", error);
    return NextResponse.json({ error: "Unable to retrieve tracking details." }, { status: 500 });
  }
}
