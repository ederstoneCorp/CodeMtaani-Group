import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { audit, canManageStaff, hashPassword } from "@/lib/admin-roles";
import { query } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { ensureStaffSchema } from "@/lib/staff-schema-sync";

export const runtime = "nodejs";

function generateSecureTemporaryPassword(): string {
  // Generates 16-character secure random password with upper, lower, digits, and symbols
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*-_+=";
  
  const all = uppers + lowers + digits + symbols;
  const bytes = randomBytes(16);
  
  let pwd = "";
  pwd += uppers[bytes[0] % uppers.length];
  pwd += lowers[bytes[1] % lowers.length];
  pwd += digits[bytes[2] % digits.length];
  pwd += symbols[bytes[3] % symbols.length];

  for (let i = 4; i < 16; i++) {
    pwd += all[bytes[i] % all.length];
  }

  // Shuffle
  return pwd.split("").sort(() => 0.5 - Math.random()).join("");
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!canManageStaff(session)) return NextResponse.json({ error: "Forbidden: Super Admin privileges required." }, { status: 403 });

  await ensureStaffSchema();

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    let tempPassword = body.temporary_password ? String(body.temporary_password).trim() : "";

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid staff account ID." }, { status: 400 });
    }

    if (!tempPassword) {
      tempPassword = generateSecureTemporaryPassword();
    } else {
      if (tempPassword.length < 12 || tempPassword.length > 200) {
        return NextResponse.json({ error: "Temporary password must be at least 12 characters." }, { status: 400 });
      }
      if (
        !/[A-Z]/.test(tempPassword) ||
        !/[a-z]/.test(tempPassword) ||
        !/[0-9]/.test(tempPassword) ||
        !/[^A-Za-z0-9]/.test(tempPassword)
      ) {
        return NextResponse.json(
          { error: "Password must contain uppercase, lowercase, numbers, and symbols." },
          { status: 400 }
        );
      }
    }

    const result = await query<{
      id: string;
      full_name: string;
      email: string;
      staff_number: string | null;
    }>(
      `UPDATE admin_users
       SET password_hash = $1,
           must_change_password = TRUE,
           provisioning_status = 'pending_password_change',
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, staff_number`,
      [hashPassword(tempPassword), id]
    );

    if (!result.rowCount) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    const targetUser = result.rows[0];

    await audit(session, "staff_credentials_reset", "admin_user", targetUser.id, {
      staff_number: targetUser.staff_number,
      target_email: targetUser.email,
      must_change_password: true,
    });

    return NextResponse.json({
      ok: true,
      message: `Temporary credentials reissued for ${targetUser.full_name}. The user will be required to change this password on their next login.`,
      temporary_password: tempPassword,
      staff_number: targetUser.staff_number,
    });
  } catch (error: unknown) {
    console.error("Password reset failed:", error);
    const err = error as { message?: string };
    return NextResponse.json({ error: `Unable to reissue credentials: ${err.message || "Database error."}` }, { status: 500 });
  }
}
