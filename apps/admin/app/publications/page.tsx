import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { PublicationsClient } from "./publications-client";

export default async function PublikasiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Publikasi" title="Kelola Publikasi" user={user}>
      <PublicationsClient />
    </AdminShell>
  );
}
