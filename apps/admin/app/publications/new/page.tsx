import { redirect } from "next/navigation";
import { AdminShell } from "../../_components/admin-shell";
import { getCurrentUser } from "../../_lib/auth";
import { PublicationForm } from "../publication-form";
export default async function NewPublicationPage(){const user=await getCurrentUser();if(!user)redirect("/login");return <AdminShell eyebrow="Publications" title="Create Publikasi" user={user}><PublicationForm currentUserName={user.name}/></AdminShell>}
