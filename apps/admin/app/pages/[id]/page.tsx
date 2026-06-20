import { notFound, redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getAccessToken, getCurrentUser } from "../../_lib/auth";
import { PageForm } from "../page-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getPage(id: string) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/admin/pages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.success) return null;
  return result.data;
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <AdminShell eyebrow="Pages" title="Read / Update Halaman" user={user}>
      <PageForm initialPage={page} />
    </AdminShell>
  );
}
