import { notFound, redirect } from "next/navigation";
import { AdminShell } from "../../../_components/admin-shell";
import { getAccessToken, getCurrentUser } from "../../../_lib/auth";
import { WijkForm } from "../../wijk-form";
const API_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function getItem(id:string){const token=await getAccessToken();if(!token)return null;const r=await fetch(`${API_URL}/api/admin/organization/wijk`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const j=await r.json();if(!j.success)return null;return j.data.find((item:{id:string})=>item.id===id)??null}
export default async function EditWijkPage({params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)redirect("/login");const {id}=await params;const item=await getItem(id);if(!item)notFound();return <AdminShell eyebrow="Organization" title="Read / Update Wijk" user={user}><WijkForm initialItem={item}/></AdminShell>}
