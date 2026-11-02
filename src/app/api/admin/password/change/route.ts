import { NextRequest, NextResponse } from "next/server";
import { adminCookie, adminCookieOptions, getAdminSession } from "@/lib/admin-auth";
import { audit, createAdminToken, hashPassword, verifyPassword } from "@/lib/admin-roles";
import { query } from "@/lib/db";
import { ensureStaffSchema } from "@/lib/staff-schema-sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !session.id) {
    return NextResponse.json({ error: "Unauthorised: Please sign in with your temporary credentials." }, { status: 401 });
  }

  await ensureStaffSchema();

  try {
    const body = await request.json();
    const currentPassword = String(body.current_password || "");
    const newPassword = String(body.new_password || "");
    const confirmPassword = String(body.confirm_password || "");

    if (!currentPassword) {
      return NextResponse.json({ error: "Please enter your current temporary password." }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 12 || newPassword.length > 200) {
      return NextResponse.json({ error: "New password must be at least 12 characters long." }, { status: 400 });
    }

    // Complexity requirements
    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return NextResponse.json(
        {
          error: "New password must contain uppercase, lowercase, at least one number, and at least one special character.",
        },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password cannot be identical to your current temporary password." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and password confirmation do not match." }, { status: 400 });
    }

    // Verify current temporary password against database
    const userResult = await query<{
      id: string;
      password_hash: string;
      email: string;
      full_name: string;
      role: string;
      scope: string;
      staff_number: string | null;
      department: string | null;
    }>("SELECT id, password_hash, email, full_name, role, scope, staff_number, department FROM admin_users WHERE id = $1 AND active = TRUE LIMIT 1", [
      session.id,
    ]);

    const userRow = userResult.rows[0];
    if (!userRow) {
      return NextResponse.json({ error: "Staff account not found or deactivated." }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, userRow.password_hash)) {
      return NextResponse.json({ error: "Current temporary password is incorrect." }, { status: 400 });
    }

    // Update password, clear must_change_password flag, record timestamp and status
    await query(
      `UPDATE admin_users
       SET password_hash = $1,
           must_change_password = FALSE,
           provisioning_status = 'active',
           password_changed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [hashPassword(newPassword), session.id]
    );

    // Audit the security event
    await audit(session, "password_changed", "admin_user", session.id, {
      reason: "mandatory_first_login_reset",
      staff_number: session.staffNumber,
    });

    // Create refreshed session token with mustChangePassword = false
    const refreshedSession = {
      ...session,
      mustChangePassword: false,
      provisioningStatus: "active",
    };

    const response = NextResponse.json({
      ok: true,
      message: "Password changed successfully! You now have full access to your staff workspace.",
      redirect: "/admin",
    });

    response.cookies.set(adminCookie, createAdminToken(refreshedSession), adminCookieOptions);
    return response;
  } catch (error: unknown) {
    console.error("Password update failed:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: `Unable to complete password change: ${err.message || "Database error."}` },
      { status: 500 }
    );
  }
}
