import { redirect } from "next/navigation";

export default function NewPage() {
  redirect("/settings?tab=pages");
}
