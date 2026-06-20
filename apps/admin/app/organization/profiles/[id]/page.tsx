import { notFound, redirect } from "next/navigation";
import { AdminShell } from "../../../_components/admin-shell";
import { getAccessToken, getCurrentUser } from "../../../_lib/auth";
import { ProfileForm } from "../../profile-form";
const API_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function getData(id:string){const token=await getAccessToken();if(!token)return null;const [c,p]=await Promise.all([fetch(`${API_URL}/api/admin/organization/categories`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"}),fetch(`${API_URL}/api/admin/organization/profiles`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"})]);const [cj,pj]=await Promise.all([c.json(),p.json()]);if(!cj.success||!pj.success)return null;return {categories:cj.data,item:pj.data.find((item:{id:string})=>item.id===id)??null}}
export default async function EditProfilePage({params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)redirect("/login");const {id}=await params;const data=await getData(id);if(!data?.item)notFound();return <AdminShell eyebrow="Organization" title="Read / Update Profil" user={user}><ProfileForm categories={data.categories} initialItem={data.item}/></AdminShell>}
