import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export type AdminRole =
  | "super_admin"
  | "executive_administrator"
  | "technical_administrator"
  | "department_head"
  | "project_manager"
  | "staff_member"
  | "developer"
  | "business_development"
  | "marketing_and_communications"
  | "research_and_innovation"
  | "content_manager"
  | "operations"
  | "careers"
  | "partnerships"
  | "viewer";

export type AdminScope = "all" | "enquiry" | "career" | "partnership";

export type AdminSession = {
  id: string | null;
  email: string;
  fullName: string;
  role: AdminRole;
  scope: AdminScope;
  staffNumber?: string | null;
  department?: string | null;
  mustChangePassword?: boolean;
  provisioningStatus?: string;
  legacy: boolean;
};

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  return salt.toString("hex") + ":" + scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, encoded: string) {
  try {
    const [saltHex, hashHex] = encoded.split(":");
    const salt = Buffer.from(saltHex, "hex"),
      expected = Buffer.from(hashHex, "hex");
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, 64);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function verifyLegacyPassword(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const encoded = process.env.ADMIN_PASSWORD_HASH || "";
  return Boolean(expectedEmail && email.trim().toLowerCase() === expectedEmail && verifyPassword(password, encoded));
}

export function createAdminToken(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}

export async function authenticateStaff(email: string, password: string): Promise<AdminSession | null> {
  const result = await db().query(
    `SELECT id, email, full_name, password_hash, role, scope, staff_number, department,
            must_change_password, provisioning_status, active
     FROM admin_users WHERE lower(email)=lower($1) AND active=TRUE LIMIT 1`,
    [email.trim()]
  );
  const row = result.rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  await db().query("UPDATE admin_users SET last_login_at=NOW() WHERE id=$1", [row.id]);
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    scope: row.scope,
    staffNumber: row.staff_number || null,
    department: row.department || null,
    mustChangePassword: Boolean(row.must_change_password),
    provisioningStatus: row.provisioning_status || "active",
    legacy: false,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const { cookies } = await import("next/headers");
    const token = (await cookies()).get("codemtaani_admin")?.value;
    if (!token) return null;
    const [payload, supplied] = token.split(".");
    if (!payload || !supplied) return null;
    const expected = sign(payload),
      a = Buffer.from(supplied),
      b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession & { exp: number };
    if (!data.email || data.exp <= Date.now()) return null;
    if (data.legacy) {
      if (data.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return null;
      return {
        id: null,
        email: data.email,
        fullName: "Administrator",
        role: "super_admin",
        scope: "all",
        mustChangePassword: false,
        provisioningStatus: "active",
        legacy: true,
      };
    }
    if (!data.id) return null;
    const result = await db().query(
      `SELECT id, email, full_name, role, scope, staff_number, department,
              must_change_password, provisioning_status
       FROM admin_users WHERE id=$1 AND active=TRUE LIMIT 1`,
      [data.id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      scope: row.scope,
      staffNumber: row.staff_number || null,
      department: row.department || null,
      mustChangePassword: Boolean(row.must_change_password),
      provisioningStatus: row.provisioning_status || "active",
      legacy: false,
    };
  } catch {
    return null;
  }
}

export async function audit(
  session: AdminSession,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {},
  options?: { previousState?: unknown; newState?: unknown; ipAddress?: string }
) {
  try {
    await db().query(
      `INSERT INTO admin_audit_log(actor_id, actor_email, action, target_type, target_id, metadata, staff_number, previous_state, new_state, ip_address)
       VALUES($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9::jsonb, $10)`,
      [
        session.id,
        session.email,
        action,
        targetType || null,
        targetId || null,
        JSON.stringify(metadata),
        session.staffNumber || null,
        options?.previousState ? JSON.stringify(options.previousState) : null,
        options?.newState ? JSON.stringify(options.newState) : null,
        options?.ipAddress || null,
      ]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

export async function recordLoginAttempt(email: string, ip: string, succeeded: boolean) {
  const key = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
  await db().query("INSERT INTO admin_login_attempts(email_key,ip_key,succeeded) VALUES($1,$2,$3)", [
    key(email.trim().toLowerCase()),
    key(ip),
    succeeded,
  ]);
  await db().query("DELETE FROM admin_login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days'");
}

export async function loginIsLimited(email: string, ip: string) {
  const key = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
  const result = await db().query(
    "SELECT COUNT(*)::int AS count FROM admin_login_attempts WHERE attempted_at > NOW() - INTERVAL '15 minutes' AND succeeded=FALSE AND (email_key=$1 OR ip_key=$2)",
    [key(email.trim().toLowerCase()), key(ip)]
  );
  return result.rows[0].count >= 10;
}

export function isPasswordChangeRequired(session: AdminSession): boolean {
  return Boolean(session.mustChangePassword);
}

export function allowedTypes(session: AdminSession): string[] {
  if (session.mustChangePassword) return [];
  if (["super_admin", "executive_administrator", "operations", "department_head"].includes(session.role)) {
    return ["enquiry", "career", "partnership"];
  }
  if (session.role === "business_development") {
    return ["enquiry", "partnership"];
  }
  if (session.role === "careers") {
    return ["career"];
  }
  if (session.role === "partnerships") {
    return ["partnership"];
  }
  return session.scope === "all" ? ["enquiry", "career", "partnership"] : [session.scope];
}

export function canEdit(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role !== "viewer";
}

export function canManageStaff(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role === "super_admin" || session.role === "executive_administrator";
}

export function canManageProjects(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "technical_administrator",
    "department_head",
    "project_manager",
    "developer",
  ].includes(session.role);
}

export function canManageTasks(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role !== "viewer";
}

export function canManageAnnouncements(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return ["super_admin", "executive_administrator", "department_head", "marketing_and_communications"].includes(
    session.role
  );
}

export function canManageContent(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "marketing_and_communications",
    "content_manager",
  ].includes(session.role);
}

export function canManageMembers(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return ["super_admin", "executive_administrator", "operations"].includes(session.role);
}

export function canManageEnquiries(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "business_development",
    "department_head",
    "operations",
  ].includes(session.role);
}

export function canReviewSubmissions(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "technical_administrator",
    "department_head",
    "project_manager",
    "operations",
  ].includes(session.role);
}

export function canManageResearch(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "technical_administrator",
    "research_and_innovation",
  ].includes(session.role);
}

export function canManageEvents(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return [
    "super_admin",
    "executive_administrator",
    "marketing_and_communications",
    "operations",
  ].includes(session.role);
}

export function canManageSettings(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role === "super_admin";
}

export function canDeleteArticle(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role === "super_admin" || session.role === "executive_administrator";
}

export function canViewAudit(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role === "super_admin" || session.role === "executive_administrator";
}

export function canExport(session: AdminSession): boolean {
  if (session.mustChangePassword) return false;
  return session.role !== "viewer";
}
