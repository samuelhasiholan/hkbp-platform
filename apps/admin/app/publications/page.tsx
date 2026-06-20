import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { PublicationsClient } from "./publications-client";

export default async function PublicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Publications" title="Kelola Berita & Publikasi" user={user}>
      <PublicationsClient />
    </AdminShell>
  );
}
