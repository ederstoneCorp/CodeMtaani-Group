import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAdminSession();
  if (!session) {
    const params = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
      else if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    }
    const destination = `/admin${query.size ? `?${query.toString()}` : ""}`;
    redirect(`/admin/login?next=${encodeURIComponent(destination)}`);
  }
  if (session.mustChangePassword) redirect("/admin/change-password");
  return <AdminPanel />;
}
