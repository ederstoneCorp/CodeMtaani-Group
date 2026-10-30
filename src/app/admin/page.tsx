import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminPage() { return <AdminPanel />; }
