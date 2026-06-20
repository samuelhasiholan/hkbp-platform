import { redirect } from "next/navigation";
import { AdminShell } from "../../../_components/admin-shell";
import { getAccessToken, getCurrentUser } from "../../../_lib/auth";
import { ProfileForm } from "../../profile-form";
const API_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function getCategories(){const token=await getAccessToken();if(!token)return[];const r=await fetch(`${API_URL}/api/admin/organization/categories`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const j=await r.json();return j.success?j.data:[]}
export default async function NewProfilePage(){const user=await getCurrentUser();if(!user)redirect("/login");const categories=await getCategories();return <AdminShell eyebrow="Organization" title="Create Profil" user={user}><ProfileForm categories={categories}/></AdminShell>}
