import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const initialTab = params?.tab === "pages" ? "pages" : "settings";

  return (
    <AdminShell eyebrow="Settings" title="Pengaturan Website" user={user}>
      <SettingsTabs initialTab={initialTab} />
    </AdminShell>
  );
}
