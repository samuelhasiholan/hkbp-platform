import { CalendarDays, FileText, GalleryHorizontalEnd, LayoutDashboard, Newspaper, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { CurrentUser } from "../_lib/auth";
import { LogoutButton } from "./logout-button";
import { SessionRefresh } from "./session-refresh";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Pages", href: "/pages", icon: FileText },
  { label: "Organization", href: "/organization", icon: Users },
  { label: "Gallery", href: "/gallery", icon: GalleryHorizontalEnd },
  { label: "Publications", href: "/publications", icon: Newspaper },
  { label: "Warta", href: "/warta", icon: FileText },
  { label: "Schedules", href: "/schedules", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AdminShell({ children, title, eyebrow, user }: { children: React.ReactNode; title: string; eyebrow: string; user: CurrentUser }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SessionRefresh />
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
                <Link className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href={item.href} key={item.label}>
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="px-5 py-6 lg:px-8">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-700">{eyebrow}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">{title}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-950">{user.name}</p>
                <p className="text-xs font-medium text-slate-500">{user.roles.join(", ")}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
