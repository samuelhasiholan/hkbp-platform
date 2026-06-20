import { redirect } from "next/navigation";
import { AdminShell } from "../../../_components/admin-shell";
import { getCurrentUser } from "../../../_lib/auth";
import { WijkForm } from "../../wijk-form";
export default async function NewWijkPage(){const user=await getCurrentUser();if(!user)redirect("/login");return <AdminShell eyebrow="Organization" title="Create Wijk" user={user}><WijkForm/></AdminShell>}
