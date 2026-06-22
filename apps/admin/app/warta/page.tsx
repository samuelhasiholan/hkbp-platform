import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { WartaClient } from "./warta-client";

export default async function WartaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Warta" title="Kelola Warta" user={user}>
      <WartaClient />
    </AdminShell>
  );
}
