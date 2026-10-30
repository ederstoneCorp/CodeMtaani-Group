import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "codemtaani_admin";
const MAX_AGE = 60 * 60 * 8;

function signature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAdminPassword(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const encoded = process.env.ADMIN_PASSWORD_HASH || "";
  const [salt, expectedHex] = encoded.split(":");
  if (!expectedEmail || !salt || !expectedHex || email.trim().toLowerCase() !== expectedEmail) return false;
  try {
    const actual = scryptSync(password, Buffer.from(salt, "hex"), 64);
    const expected = Buffer.from(expectedHex, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function createAdminToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return payload + "." + signature(payload);
}

export async function isAdminAuthenticated() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return false;
    const [payload, supplied] = token.split(".");
    if (!payload || !supplied) return false;
    const expected = signature(payload);
    const a = Buffer.from(supplied), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email: string; exp: number };
    return data.email === process.env.ADMIN_EMAIL?.trim().toLowerCase() && data.exp > Date.now();
  } catch { return false; }
}

export const adminCookie = COOKIE;
export const adminCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: MAX_AGE };
