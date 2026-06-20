import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { OrganizationClient } from "./organization-client";

export default async function OrganizationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Organization" title="Kelola Organisasi" user={user}>
      <OrganizationClient />
    </AdminShell>
  );
}
