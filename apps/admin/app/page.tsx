import { ArrowRight, Camera, CheckCircle2, Clock3, FilePlus2, FileText, ImageIcon, Newspaper, PenLine, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "./_components/admin-shell";
import { getAccessToken, getCurrentUser } from "./_lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type ListResult<T> = { success: boolean; data: T[]; meta?: { total?: number } };
type PageItem = { id: string; title: string; slug: string; status: Status; updatedAt?: string; description?: string };
type PublicationItem = { id: string; title: string; slug: string; status: Status; updatedAt?: string; publishedAt?: string | null; author: string };
type WartaItem = { id: string; title: string; slug: string; status: Status; isCurrent: boolean; date: string; theme: string; updatedAt?: string };
type GalleryItem = { id: string; description: string; status: Status; updatedAt?: string };
type ProfileItem = { id: string; name: string; isActive: boolean };
type WijkItem = { id: string; name: string };

async function fetchAdmin<T>(path: string, token: string): Promise<ListResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success) return { success: false, data: [] };
    return result;
  } catch {
    return { success: false, data: [] };
  }
}

function total<T>(result: ListResult<T>) {
  return result.meta?.total ?? result.data.length;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status: Status) {
  if (status === "PUBLISHED") return "bg-emerald-50 text-emerald-700";
  if (status === "ARCHIVED") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

export default async function AdminHomePage() {
  const [user, token] = await Promise.all([getCurrentUser(), getAccessToken()]);
  if (!user || !token) redirect("/login");

  const [pages, pageDrafts, publications, publicationDrafts, warta, wartaDrafts, gallery, galleryDrafts, profiles, wijk] = await Promise.all([
    fetchAdmin<PageItem>("/api/admin/pages?limit=5", token),
    fetchAdmin<PageItem>("/api/admin/pages?status=DRAFT&limit=1", token),
    fetchAdmin<PublicationItem>("/api/admin/publications?limit=5", token),
    fetchAdmin<PublicationItem>("/api/admin/publications?status=DRAFT&limit=1", token),
    fetchAdmin<WartaItem>("/api/admin/warta?limit=5", token),
    fetchAdmin<WartaItem>("/api/admin/warta?status=DRAFT&limit=1", token),
    fetchAdmin<GalleryItem>("/api/admin/gallery?limit=5", token),
    fetchAdmin<GalleryItem>("/api/admin/gallery?status=DRAFT&limit=1", token),
    fetchAdmin<ProfileItem>("/api/admin/organization/profiles", token),
    fetchAdmin<WijkItem>("/api/admin/organization/wijk", token),
  ]);

  const draftTotal = total(pageDrafts) + total(publicationDrafts) + total(wartaDrafts) + total(galleryDrafts);
  const publishedTotal =
    pages.data.filter((item) => item.status === "PUBLISHED").length +
    publications.data.filter((item) => item.status === "PUBLISHED").length +
    warta.data.filter((item) => item.status === "PUBLISHED").length +
    gallery.data.filter((item) => item.status === "PUBLISHED").length;
  const activeWarta = warta.data.find((item) => item.isCurrent);
  const activeProfiles = profiles.data.filter((item) => item.isActive).length;

  const metrics = [
    { label: "Halaman", value: total(pages), detail: `${pages.data.filter((item) => item.status === "PUBLISHED").length} published terbaru`, icon: FileText },
    { label: "Publikasi", value: total(publications), detail: `${total(publicationDrafts)} draft menunggu`, icon: Newspaper },
    { label: "Galeri", value: total(gallery), detail: `${total(galleryDrafts)} draft gambar`, icon: Camera },
    { label: "Organisasi", value: activeProfiles, detail: `${wijk.data.length} wijk terdata`, icon: Users },
  ];

  const recentItems = [
    ...publications.data.map((item) => ({ kind: "Publikasi", title: item.title, status: item.status, href: `/publications/${item.id}`, date: item.updatedAt ?? item.publishedAt })),
    ...warta.data.map((item) => ({ kind: "Warta", title: item.title, status: item.status, href: `/warta/${item.id}`, date: item.updatedAt ?? item.date })),
    ...pages.data.map((item) => ({ kind: "Halaman", title: item.title, status: item.status, href: `/pages/${item.id}`, date: item.updatedAt })),
  ]
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 6);

  const shortcuts = [
    { label: "Buat Publikasi", href: "/publications/new", icon: PenLine },
    { label: "Tambah Warta", href: "/warta/new", icon: FilePlus2 },
    { label: "Upload Galeri", href: "/gallery/new", icon: ImageIcon },
    { label: "Kelola Profil", href: "/organization", icon: Users },
  ];

  return (
    <AdminShell eyebrow="Dashboard" title="Ringkasan Konten Gereja" user={user}>
      <div className="grid gap-6 py-6">
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-700">Selamat datang, {user.name}</p>
                <h3 className="mt-2 text-xl font-bold">Konten website hari ini</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Ada {draftTotal} draft yang bisa ditinjau dan {publishedTotal} konten published di daftar terbaru. Fokus utama: pastikan warta aktif, publikasi terbaru, dan profil organisasi tetap rapi.
                </p>
              </div>
              <div className="grid min-w-44 gap-2 rounded-md bg-slate-50 p-3 text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Clock3 size={16} />
                  {formatDate(new Date().toISOString())}
                </div>
                <p className="text-xs leading-5 text-slate-500">Semua angka diambil langsung dari data CMS.</p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={18} />
              <h3 className="font-bold">Warta Aktif</h3>
            </div>
            {activeWarta ? (
              <div className="mt-4">
                <p className="font-bold leading-6">{activeWarta.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(activeWarta.date)} · {activeWarta.theme}</p>
                <Link href={`/warta/${activeWarta.id}`} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold">
                  Buka <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">Belum ada warta yang ditandai aktif.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <span className="inline-flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h3 className="font-bold">Aktivitas Konten Terbaru</h3>
              <p className="mt-1 text-sm text-slate-500">Gabungan dari publikasi, warta, dan halaman.</p>
            </div>
            <div className="divide-y divide-slate-200">
              {recentItems.length ? recentItems.map((item) => (
                <Link key={`${item.kind}-${item.href}`} href={item.href} className="grid gap-3 px-4 py-3 text-sm hover:bg-slate-50 sm:grid-cols-[110px_1fr_120px] sm:items-center">
                  <span className="font-bold text-slate-500">{item.kind}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{formatDate(item.date)}</span>
                  </span>
                  <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
                </Link>
              )) : (
                <p className="p-4 text-sm text-slate-500">Belum ada aktivitas konten.</p>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold">Aksi Cepat</h3>
              <div className="mt-4 grid gap-2">
                {shortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
                      <span className="inline-flex items-center gap-2"><Icon size={16} />{item.label}</span>
                      <ArrowRight size={15} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold">Perlu Dicek</h3>
              <div className="mt-4 grid gap-3 text-sm">
                <CheckItem label="Draft konten" value={draftTotal ? `${draftTotal} item` : "Bersih"} active={draftTotal > 0} />
                <CheckItem label="Warta aktif" value={activeWarta ? "Sudah ada" : "Belum ada"} active={!activeWarta} />
                <CheckItem label="Profil aktif" value={`${activeProfiles} orang`} active={activeProfiles === 0} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function CheckItem({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
      <span className="font-medium text-slate-600">{label}</span>
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${active ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{value}</span>
    </div>
  );
}
