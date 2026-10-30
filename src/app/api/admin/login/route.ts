import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminCookie, adminCookieOptions } from "@/lib/admin-auth";
import { authenticateStaff, createAdminToken, recordLoginAttempt, loginIsLimited, verifyLegacyPassword, audit, type AdminSession } from "@/lib/admin-roles";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    if (!email || email.length > 180 || password.length > 200 || !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    if (await loginIsLimited(email, ip)) return NextResponse.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    let session: AdminSession | null = null;
    try { session = await authenticateStaff(email, password); } catch (error) { console.error("Staff authentication unavailable:", error); }
    if (!session && verifyLegacyPassword(email, password)) session = { id: null, email, fullName: "Administrator", role: "super_admin", scope: "all", legacy: true };
    await recordLoginAttempt(email, ip, Boolean(session));
    if (!session) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    try { await audit(session, "login"); } catch (error) { console.error("Admin login audit failed:", error); }
    const response = NextResponse.json({ ok: true, role: session.role });
    response.cookies.set(adminCookie, createAdminToken(session), adminCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 503 });
  }
}
