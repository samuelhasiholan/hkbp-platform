import { redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getCurrentUser } from "../../_lib/auth";
import { WartaForm } from "../warta-form";
export default async function NewWartaPage(){const user=await getCurrentUser();if(!user)redirect("/login");return <AdminShell eyebrow="Warta" title="Create Warta" user={user}><WartaForm/></AdminShell>}
