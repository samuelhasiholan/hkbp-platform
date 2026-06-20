import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { PagesClient } from "./pages-client";

export default async function PagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Pages" title="Kelola Halaman Website" user={user}>
      <PagesClient />
    </AdminShell>
  );
}
