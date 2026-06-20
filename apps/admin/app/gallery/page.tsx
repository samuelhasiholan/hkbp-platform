import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getCurrentUser } from "../_lib/auth";
import { GalleryClient } from "./gallery-client";

export default async function GalleryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Gallery" title="Kelola Galeri" user={user}>
      <GalleryClient />
    </AdminShell>
  );
}
