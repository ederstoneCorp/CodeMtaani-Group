import { cookies } from "next/headers";
import { getAdminSession, type AdminSession } from "@/lib/admin-roles";
export type { AdminSession };
export async function isAdminAuthenticated() { return Boolean(await getAdminSession()); }
export { getAdminSession };
export const adminCookie = "codemtaani_admin";
export const adminCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 60 * 60 * 8 };
