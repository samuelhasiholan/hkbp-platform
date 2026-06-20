import { redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getCurrentUser } from "../../_lib/auth";
import { GalleryForm } from "../gallery-form";
export default async function NewGalleryPage(){const user=await getCurrentUser();if(!user)redirect("/login");return <AdminShell eyebrow="Gallery" title="Create Galeri" user={user}><GalleryForm/></AdminShell>}
