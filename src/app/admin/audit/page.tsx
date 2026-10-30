import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminAuditPanel } from "@/components/admin-audit-panel";
export const metadata: Metadata = { title: "Activity log", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminAuditPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");
  return <AdminAuditPanel />;
}
