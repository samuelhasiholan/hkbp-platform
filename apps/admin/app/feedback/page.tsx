import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { FeedbackClient } from "./feedback-client";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AdminShell eyebrow="Kritik & Saran" title="Masukan Jemaat" user={user}>
      <FeedbackClient />
    </AdminShell>
  );
}
