import { NextRequest, NextResponse } from "next/server";
import { adminCookie, adminCookieOptions, createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");
    if (email.length > 180 || password.length > 200 || !verifyAdminPassword(email, password)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookie, createAdminToken(email.trim().toLowerCase()), adminCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 400 });
  }
}
