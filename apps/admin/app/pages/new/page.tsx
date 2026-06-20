import { redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getCurrentUser } from "../../_lib/auth";
import { PageForm } from "../page-form";

export default async function NewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Pages" title="Create Halaman" user={user}>
      <PageForm />
    </AdminShell>
  );
}
