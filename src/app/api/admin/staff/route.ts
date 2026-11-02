import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { audit, canManageStaff, hashPassword } from "@/lib/admin-roles";
import { query } from "@/lib/db";
import { ensureStaffSchema } from "@/lib/staff-schema-sync";

export const runtime = "nodejs";

const validRoles = [
  "super_admin",
  "executive_administrator",
  "technical_administrator",
  "department_head",
  "project_manager",
  "staff_member",
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

const validScopes = ["all", "enquiry", "career", "partnership"];

function isValidScopeForRole(role: string, scope: string) {
  if (!validRoles.includes(role) || !validScopes.includes(scope)) return false;
  if (
    [
      "super_admin",
      "executive_administrator",
      "technical_administrator",
      "department_head",
      "project_manager",
      "developer",
      "operations",
      "staff_member",
    ].includes(role)
  ) {
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
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden: Super Admin or Executive privileges required." }, { status: 403 });

  // Self-heal table schema before querying
  await ensureStaffSchema();

  try {
    const result = await query(
      `SELECT id, email, full_name, role, scope, active, created_at, last_login_at,
              staff_number, department, position, phone, notes,
              must_change_password, password_changed_at, provisioning_status
       FROM admin_users ORDER BY created_at DESC`
    );
    return NextResponse.json({ users: result.rows }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (primaryError) {
    console.error("Staff list primary query failed, attempting resilient fallback:", primaryError);
    try {
      // Fallback query if certain optional columns are in mid-migration
      const fallbackResult = await query(
        `SELECT id, email, full_name, role, scope, active, created_at, last_login_at,
                COALESCE(staff_number, 'CMG-STAFF-0000') AS staff_number,
                COALESCE(department, '') AS department,
                COALESCE(position, '') AS position,
                COALESCE(phone, '') AS phone,
                COALESCE(notes, '') AS notes,
                COALESCE(must_change_password, FALSE) AS must_change_password,
                password_changed_at,
                COALESCE(provisioning_status, 'active') AS provisioning_status
         FROM admin_users ORDER BY created_at DESC`
      );
      return NextResponse.json({ users: fallbackResult.rows }, { headers: { "Cache-Control": "no-store, private" } });
    } catch (fallbackError: unknown) {
      const msg = fallbackError instanceof Error ? fallbackError.message : "Database connection unavailable.";
      console.error("Staff directory retrieval failed completely:", fallbackError);
      return NextResponse.json(
        { error: `Database error loading staff accounts: ${msg}`, code: "DATABASE_ERROR" },
        { status: 503 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden: Super Admin or Executive privileges required." }, { status: 403 });

  await ensureStaffSchema();

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    const password = String(body.password || "");
    const role = String(body.role || "").trim();
    const scope = String(body.scope || "all").trim();
    const department = body.department ? String(body.department).trim() : null;
    const position = body.position ? String(body.position).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    // Field Validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }
    if (!fullName || fullName.length > 120) {
      return NextResponse.json({ error: "Full name is required (maximum 120 characters)." }, { status: 400 });
    }
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role selection: "${role}".` }, { status: 400 });
    }
    if (!isValidScopeForRole(role, scope)) {
      return NextResponse.json({ error: `Invalid scope "${scope}" for role "${role}".` }, { status: 400 });
    }

    // Password security requirements for initial temporary password:
    // Minimum 12 characters, uppercase, lowercase, digit, and special character
    if (password.length < 12 || password.length > 200) {
      return NextResponse.json({ error: "Initial temporary password must be at least 12 characters." }, { status: 400 });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must include uppercase, lowercase, at least one number, and at least one special character." },
        { status: 400 }
      );
    }

    // Authorization: Only super_admin can create another super_admin
    if (role === "super_admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin can create another Super Admin account." }, { status: 403 });
    }

    // Explicit Check: Does an account with this normalized email already exist?
    const existingCheck = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      staff_number: string | null;
      active: boolean;
      provisioning_status: string | null;
    }>(
      `SELECT id, email, full_name, role, staff_number, active, provisioning_status
       FROM admin_users WHERE lower(email) = lower($1) LIMIT 1`,
      [email]
    );

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      return NextResponse.json(
        {
          error: `An account with email "${email}" is already registered for ${existing.full_name} (${existing.staff_number || "CMG-STAFF"}).`,
          code: "ACCOUNT_EXISTS",
          existing_staff: {
            id: existing.id,
            email: existing.email,
            full_name: existing.full_name,
            role: existing.role,
            staff_number: existing.staff_number,
            active: existing.active,
          },
        },
        { status: 409 }
      );
    }

    // Provision new staff member with mandatory password change flag set to TRUE
    const result = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      scope: string;
      active: boolean;
      created_at: string;
      staff_number: string;
      department: string | null;
      position: string | null;
      phone: string | null;
      must_change_password: boolean;
      provisioning_status: string;
    }>(
      `INSERT INTO admin_users(
        email, full_name, password_hash, role, scope, department, position, phone,
        must_change_password, provisioning_status
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'pending_password_change')
      RETURNING id, email, full_name, role, scope, active, created_at, staff_number,
                department, position, phone, must_change_password, provisioning_status`,
      [email, fullName, hashPassword(password), role, scope, department, position, phone]
    );

    const newUser = result.rows[0];

    await audit(session, "staff_created", "admin_user", newUser.id, {
      staff_number: newUser.staff_number,
      role,
      scope,
      department,
      position,
      must_change_password: true,
    });

    return NextResponse.json(
      {
        user: newUser,
        message: `Staff member onboarded successfully. Unique Staff Number: ${newUser.staff_number}. Mandatory password change required on first login.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Staff creation failed:", error);
    const err = error as { code?: string; message?: string };

    if (err.code === "23505") {
      return NextResponse.json(
        { error: "A unique constraint collision occurred (email or staff number). Please retry.", code: "DUPLICATE_COLLISION" },
        { status: 409 }
      );
    }
    if (err.code === "23514") {
      return NextResponse.json(
        { error: `Database constraint violation: ${err.message}`, code: "CONSTRAINT_VIOLATION" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Account provisioning failed: ${err.message || "Database error."}`, code: "PROVISIONING_FAILED" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden: Super Admin or Executive privileges required." }, { status: 403 });

  await ensureStaffSchema();

  try {
    const body = await request.json();
    const id = String(body.id || "");

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid staff ID format." }, { status: 400 });
    }

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
          return NextResponse.json({ error: `${field} exceeds maximum allowed length.` }, { status: 400 });
        }
        if (constraints.validate && val && !constraints.validate(val)) {
          return NextResponse.json({ error: `Invalid format for ${field}.` }, { status: 400 });
        }
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(field === "email" && val ? val.toLowerCase() : val || null);
        paramIndex++;
      }
    }

    if (body.role !== undefined) {
      const newRole = String(body.role).trim();
      if (!validRoles.includes(newRole)) {
        return NextResponse.json({ error: `Invalid role: ${newRole}.` }, { status: 400 });
      }
      if (newRole === "super_admin" && session.role !== "super_admin") {
        return NextResponse.json({ error: "Only a Super Admin can assign the Super Admin role." }, { status: 403 });
      }
      setClauses.push(`role = $${paramIndex}`);
      values.push(newRole);
      paramIndex++;
    }

    if (body.scope !== undefined) {
      const newScope = String(body.scope).trim();
      if (!validScopes.includes(newScope)) {
        return NextResponse.json({ error: `Invalid scope: ${newScope}.` }, { status: 400 });
      }
      setClauses.push(`scope = $${paramIndex}`);
      values.push(newScope);
      paramIndex++;
    }

    if (typeof body.active === "boolean") {
      if (session.id === id && !body.active) {
        return NextResponse.json({ error: "Security restriction: You cannot deactivate your own administrative account." }, { status: 400 });
      }
      setClauses.push(`active = $${paramIndex}`);
      values.push(body.active);
      paramIndex++;

      // Update provisioning_status if deactivating or reactivating
      if (!body.active) {
        setClauses.push(`provisioning_status = 'inactive'`);
      } else {
        setClauses.push(`provisioning_status = 'active'`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No update fields were provided." }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      scope: string;
      active: boolean;
      staff_number: string;
      department: string | null;
      position: string | null;
      phone: string | null;
      notes: string | null;
      must_change_password: boolean;
      provisioning_status: string;
      created_at: string;
      last_login_at: string | null;
    }>(
      `UPDATE admin_users SET ${setClauses.join(", ")} WHERE id = $${paramIndex}
       RETURNING id, email, full_name, role, scope, active, staff_number, department,
                 position, phone, notes, must_change_password, provisioning_status, created_at, last_login_at`,
      values
    );

    if (!result.rowCount) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });

    await audit(session, "staff_updated", "admin_user", id, {
      fields: Object.keys(body).filter((k) => k !== "id"),
    });

    return NextResponse.json({
      user: result.rows[0],
      message: `Staff profile for ${result.rows[0].full_name} (${result.rows[0].staff_number || "CMG-STAFF"}) updated successfully.`,
    });
  } catch (error: unknown) {
    console.error("Staff update failed:", error);
    const err = error as { message?: string };
    return NextResponse.json({ error: `Unable to update staff account: ${err.message || "Database error."}` }, { status: 503 });
  }
}
