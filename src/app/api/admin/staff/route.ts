import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { audit, canManageStaff, hashPassword } from "@/lib/admin-roles";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const roles = [
  "super_admin",
  "executive_administrator",
  "technical_administrator",
  "developer",
  "business_development",
  "marketing_and_communications",
  "research_and_innovation",
  "content_manager",
  "operations",
  "careers",
  "partnerships",
  "viewer",
];

const scopes = ["all", "enquiry", "career", "partnership"];

function validScope(role: string, scope: string) {
  if (!roles.includes(role) || !scopes.includes(scope)) return false;
  if (["super_admin", "executive_administrator", "technical_administrator", "developer", "operations"].includes(role)) {
    return scope === "all";
  }
  if (role === "business_development") return scope === "enquiry" || scope === "partnership" || scope === "all";
  if (role === "careers") return scope === "career";
  if (role === "partnerships") return scope === "partnership";
  return true;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const result = await query(
      "SELECT id,email,full_name,role,scope,active,created_at,last_login_at FROM admin_users ORDER BY created_at DESC"
    );
    return NextResponse.json({ users: result.rows }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Staff list failed:", error);
    return NextResponse.json({ error: "Unable to load staff accounts." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    const password = String(body.password || "");
    const role = String(body.role || "");
    const scope = String(body.scope || "all");

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 180 ||
      !fullName ||
      fullName.length > 120 ||
      password.length < 12 ||
      password.length > 200 ||
      !validScope(role, scope)
    ) {
      return NextResponse.json(
        { error: "Provide a valid name, email, role, scope and password of at least 12 characters." },
        { status: 400 }
      );
    }

    const result = await query<{ id: string; email: string; full_name: string; role: string; scope: string; active: boolean; created_at: string }>(
      "INSERT INTO admin_users(email,full_name,password_hash,role,scope) VALUES($1,$2,$3,$4,$5) RETURNING id,email,full_name,role,scope,active,created_at",
      [email, fullName, hashPassword(password), role, scope]
    );

    await audit(session, "staff_created", "admin_user", result.rows[0].id, { role, scope });
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Staff creation failed:", error);
    return NextResponse.json(
      { error: "Unable to create staff account. The email may already exist or database connection is unavailable." },
      { status: 503 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const active = body.active;

    if (!/^[0-9a-f-]{36}$/i.test(id) || typeof active !== "boolean") {
      return NextResponse.json({ error: "Invalid staff update." }, { status: 400 });
    }

    if (session.id === id && !active) {
      return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
    }

    const result = await query<{ id: string; email: string; full_name: string; role: string; scope: string; active: boolean }>(
      "UPDATE admin_users SET active=$2,updated_at=NOW() WHERE id=$1 RETURNING id,email,full_name,role,scope,active",
      [id, active]
    );

    if (!result.rowCount) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    await audit(session, active ? "staff_activated" : "staff_deactivated", "admin_user", id);
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Staff update failed:", error);
    return NextResponse.json({ error: "Unable to update staff account." }, { status: 503 });
  }
}
