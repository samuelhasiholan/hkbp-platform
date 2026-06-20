import { notFound, redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getAccessToken, getCurrentUser } from "../../_lib/auth";
import { PublicationForm } from "../publication-form";
const API_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function getItem(id:string){const token=await getAccessToken();if(!token)return null;const response=await fetch(`${API_URL}/api/admin/publications/${id}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const result=await response.json();if(!response.ok||!result.success)return null;return result.data}
export default async function EditPublicationPage({params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)redirect("/login");const {id}=await params;const item=await getItem(id);if(!item)notFound();return <AdminShell eyebrow="Publications" title="Read / Update Publikasi" user={user}><PublicationForm initialItem={item} currentUserName={user.name}/></AdminShell>}
