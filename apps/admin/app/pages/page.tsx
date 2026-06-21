import { redirect } from "next/navigation";

export default function PagesPage() {
  redirect("/settings?tab=pages");
}
