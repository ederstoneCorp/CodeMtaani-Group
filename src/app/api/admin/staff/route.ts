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
      `SELECT id, email, full_name, role, scope, active, created_at, last_login_at,
              staff_number, department, position, phone, notes
       FROM admin_users ORDER BY created_at DESC`
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
    const department = body.department ? String(body.department).trim() : null;
    const position = body.position ? String(body.position).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

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

    // Prevent non-super-admins from assigning super_admin role
    if (role === "super_admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can create another Super Admin." }, { status: 403 });
    }

    const result = await query<{
      id: string; email: string; full_name: string; role: string; scope: string;
      active: boolean; created_at: string; staff_number: string;
      department: string | null; position: string | null; phone: string | null;
    }>(
      `INSERT INTO admin_users(email, full_name, password_hash, role, scope, department, position, phone)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, full_name, role, scope, active, created_at, staff_number, department, position, phone`,
      [email, fullName, hashPassword(password), role, scope, department, position, phone]
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

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });
    }

    // Build dynamic update fields
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields: Record<string, { maxLen?: number; validate?: (v: unknown) => boolean }> = {
      full_name: { maxLen: 120 },
      email: { maxLen: 180, validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) },
      department: { maxLen: 80 },
      position: { maxLen: 100 },
      phone: { maxLen: 50 },
      notes: {},
    };

    for (const [field, constraints] of Object.entries(allowedFields)) {
      if (body[field] !== undefined) {
        const val = body[field] === null ? null : String(body[field]).trim();
        if (constraints.maxLen && val && val.length > constraints.maxLen) {
          return NextResponse.json({ error: `${field} is too long.` }, { status: 400 });
        }
        if (constraints.validate && val && !constraints.validate(val)) {
          return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
        }
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(val || null);
        paramIndex++;
      }
    }

    // Handle role change
    if (body.role !== undefined) {
      const newRole = String(body.role);
      if (!roles.includes(newRole)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      // Prevent non-super-admins from assigning super_admin
      if (newRole === "super_admin" && session.role !== "super_admin") {
        return NextResponse.json({ error: "Only a Super Admin can assign Super Admin role." }, { status: 403 });
      }
      setClauses.push(`role = $${paramIndex}`);
      values.push(newRole);
      paramIndex++;
    }

    // Handle scope change
    if (body.scope !== undefined) {
      const newScope = String(body.scope);
      if (!scopes.includes(newScope)) {
        return NextResponse.json({ error: "Invalid scope." }, { status: 400 });
      }
      setClauses.push(`scope = $${paramIndex}`);
      values.push(newScope);
      paramIndex++;
    }

    // Handle active toggle
    if (typeof body.active === "boolean") {
      if (session.id === id && !body.active) {
        return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
      }
      setClauses.push(`active = $${paramIndex}`);
      values.push(body.active);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<{
      id: string; email: string; full_name: string; role: string; scope: string;
      active: boolean; staff_number: string; department: string | null;
      position: string | null; phone: string | null; notes: string | null;
      created_at: string; last_login_at: string | null;
    }>(
      `UPDATE admin_users SET ${setClauses.join(", ")} WHERE id = $${paramIndex}
       RETURNING id, email, full_name, role, scope, active, staff_number, department, position, phone, notes, created_at, last_login_at`,
      values
    );

    if (!result.rowCount) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    await audit(session, "staff_updated", "admin_user", id, { fields: Object.keys(body).filter(k => k !== "id") });
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Staff update failed:", error);
    return NextResponse.json({ error: "Unable to update staff account." }, { status: 503 });
  }
}
