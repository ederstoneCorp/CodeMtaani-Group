import type { Metadata } from "next";
import { AdminStaffPanel } from "@/components/admin-staff-panel";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
export const metadata: Metadata = { title: "Staff access", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminStaffPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");
  return <AdminStaffPanel />;
}
