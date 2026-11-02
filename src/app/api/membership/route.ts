import { NextRequest, NextResponse } from "next/server";
import { registerMember } from "@/lib/members";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
    if (isRateLimited(`member:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment before submitting another application." }, { status: 429 });
    }

    const body = await request.json();
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true }); // Honeypot trap
    }

    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const category = String(body.category || "developer").trim();
    const institutionOrOrg = String(body.institution_or_org || "").trim();
    const skillsRaw = String(body.skills || "").trim();
    const interestsRaw = String(body.interests || "").trim();
    const bio = String(body.bio || "").trim();
    const githubHandle = String(body.github_handle || "").trim();
    const linkedinUrl = String(body.linkedin_url || "").trim();

    if (fullName.length < 2 || fullName.length > 120 || !emailPattern.test(email) || email.length > 180) {
      return NextResponse.json({ error: "Please provide a valid full name and email address." }, { status: 400 });
    }

    const validCategories = ["student", "developer", "creative", "researcher", "community", "collaborator"];
    const finalCategory = validCategories.includes(category) ? category : "community";

    const skills = skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20) : [];
    const interests = interestsRaw ? interestsRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20) : [];

    const member = await registerMember({
      full_name: fullName,
      email,
      category: finalCategory,
      institution_or_org: institutionOrOrg || null,
      skills,
      interests,
      bio: bio || null,
      github_handle: githubHandle ? githubHandle.replace(/^@/, "") : null,
      linkedin_url: linkedinUrl || null,
    });

    return NextResponse.json({ ok: true, id: member.id }, { status: 201 });
  } catch (error) {
    console.error("Membership registration failed:", error);
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "An application with this email address has already been submitted."
        : "Unable to complete membership registration right now. Please try again later.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
