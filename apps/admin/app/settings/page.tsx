import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Settings" title="Pengaturan Website" user={user}>
      <SettingsClient />
    </AdminShell>
  );
}
