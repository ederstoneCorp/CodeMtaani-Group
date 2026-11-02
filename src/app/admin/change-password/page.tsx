import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { MandatoryPasswordChangeForm } from "@/components/mandatory-password-change-form";

export const metadata: Metadata = {
  title: "Mandatory Password Change — CodeMtaani Group",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // If the user is not required to change their password, send them to dashboard
  if (!session.mustChangePassword) {
    redirect("/admin");
  }

  return (
    <MandatoryPasswordChangeForm
      fullName={session.fullName}
      email={session.email}
      staffNumber={session.staffNumber || null}
      role={session.role}
    />
  );
}
