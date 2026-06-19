import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, FileText, GalleryHorizontalEnd, LayoutDashboard, Newspaper, Settings, Users } from "lucide-react";
import { LogoutButton } from "./_components/logout-button";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Pages", icon: FileText },
  { label: "Organization", icon: Users },
  { label: "Gallery", icon: GalleryHorizontalEnd },
  { label: "Publications", icon: Newspaper },
  { label: "Warta", icon: FileText },
  { label: "Schedules", icon: CalendarDays },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Berita", value: "1" },
  { label: "Warta Aktif", value: "1" },
  { label: "Halaman", value: "1" },
  { label: "Draft", value: "0" },
];

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getCurrentUser() {
  const token = (await cookies()).get("hkbp_access_token")?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success) return null;
    return result.data as CurrentUser;
  } catch {
    return null;
  }
}

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-5">
          <div className="px-2">
            <p className="text-sm font-bold uppercase tracking-wide text-sky-700">HKBP CMS</p>
            <h1 className="mt-2 text-lg font-bold">Resort Srengseng Sawah</h1>
          </div>
          <nav className="mt-8 grid gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" key={item.label} type="button">
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <section className="px-5 py-6 lg:px-8">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">Dashboard</p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">Ringkasan Konten Gereja</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-950">{user.name}</p>
                <p className="text-xs font-medium text-slate-500">{user.roles.join(", ")}</p>
              </div>
              <LogoutButton />
              <button className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white" type="button">Buat Konten</button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold">Prioritas Berikutnya</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p>Hubungkan dashboard ke endpoint admin setelah modul auth dibuat.</p>
              <p>Tambahkan CRUD untuk Pages, Publications, Warta, Gallery, dan Schedules.</p>
              <p>Tambahkan upload PDF dan gambar dengan validasi MIME type.</p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
