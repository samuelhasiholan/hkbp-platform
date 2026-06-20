
"use client";

import { ChevronLeft, ChevronRight, Edit, FilePlus2, Loader2, RefreshCcw, Search, Save } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = { id: string; slug: string; name: string; description: string | null; sortOrder: number };
type Profile = { id: string; name: string; role: string; photoUrl: string | null; isActive: boolean; category: Category | null };
type Wijk = { id: string; name: string; description: string; coordinator: string | null; contact: string | null; sortOrder: number };

export function OrganizationClient() {
  const [tab, setTab] = useState<"profiles" | "wijk" | "categories">("profiles");
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wijk, setWijk] = useState<Wijk[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categoryForm, setCategoryForm] = useState({ slug: "", name: "", description: "", sortOrder: 0 });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [categoriesResponse, profilesResponse, wijkResponse] = await Promise.all([
        fetch("/api/admin/organization/categories", { cache: "no-store" }),
        fetch(`/api/admin/organization/profiles?search=${encodeURIComponent(search)}`, { cache: "no-store" }),
        fetch("/api/admin/organization/wijk", { cache: "no-store" }),
      ]);
      const [categoriesResult, profilesResult, wijkResult] = await Promise.all([categoriesResponse.json(), profilesResponse.json(), wijkResponse.json()]);
      if (!categoriesResult.success || !profilesResult.success || !wijkResult.success) throw new Error("Gagal memuat organisasi");
      setCategories(categoriesResult.data);
      setProfiles(profilesResult.data);
      setWijk(wijkResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat organisasi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setHydrated(true); load(); }, []);
  function submit(event: FormEvent) { event.preventDefault(); setPage(1); load(); }
  async function saveCategory(event: FormEvent) { event.preventDefault(); try { const response = await fetch("/api/admin/organization/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(categoryForm) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message); setCategoryForm({ slug: "", name: "", description: "", sortOrder: 0 }); setNotice("Kategori tersimpan"); await load(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan kategori"); } }

  const activeItems = tab === "profiles" ? profiles : wijk;
  const totalPages = useMemo(() => Math.max(Math.ceil(activeItems.length / 10), 1), [activeItems.length]);
  const visible = activeItems.slice((page - 1) * 10, page * 10);
  function go(nextPage: number) { setPage(Math.min(Math.max(nextPage, 1), totalPages)); }

  return <div className="grid gap-6 py-6"><div className="flex flex-wrap gap-2">{(["profiles", "wijk", "categories"] as const).map((item) => <button key={item} onClick={() => { setTab(item); setPage(1); }} className={`h-10 rounded-md px-4 text-sm font-bold ${tab === item ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>{item === "profiles" ? "Profil" : item === "wijk" ? "Wijk" : "Kategori"}</button>)}</div>{notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}{error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}{tab !== "categories" ? <section className="rounded-md border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">{tab === "profiles" ? "Profil Pelayan" : "Wilayah Wijk"}</h3><p className="mt-1 text-sm text-slate-500">10 data per halaman. Buka detail untuk read/update.</p></div><Link href={tab === "profiles" ? "/organization/profiles/new" : "/organization/wijk/new"} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white"><FilePlus2 size={17}/>Buat</Link></div><form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari"/></label><button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold"><RefreshCcw size={16}/>Muat</button></form></div><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><tr>{tab === "profiles" ? <><th className="border-b px-4 py-3">Foto</th><th className="border-b px-4 py-3">Nama</th><th className="border-b px-4 py-3">Role</th><th className="border-b px-4 py-3">Kategori</th><th className="border-b px-4 py-3">Status</th></> : <><th className="border-b px-4 py-3">Nama</th><th className="border-b px-4 py-3">Koordinator</th><th className="border-b px-4 py-3">Kontak</th><th className="border-b px-4 py-3">Order</th></>}<th className="border-b px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-200">{loading ? <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={tab === "profiles" ? 6 : 5}><Loader2 className="mr-2 inline animate-spin" size={18}/>Memuat</td></tr> : visible.length ? visible.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">{tab === "profiles" ? <><td className="px-4 py-3"><div className="h-14 w-14 overflow-hidden rounded-md bg-slate-100">{item.photoUrl ? <img src={item.photoUrl} alt="" className="h-full w-full object-cover" /> : null}</div></td><td className="px-4 py-3 font-bold">{item.name}</td><td className="px-4 py-3">{item.role}</td><td className="px-4 py-3">{item.category?.name ?? "-"}</td><td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{item.isActive ? "ACTIVE" : "INACTIVE"}</span></td><td className="px-4 py-3 text-right"><Link className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold" href={`/organization/profiles/${item.id}`}><Edit size={15}/>Buka</Link></td></> : <><td className="px-4 py-3 font-bold">{item.name}</td><td className="px-4 py-3">{item.coordinator ?? "-"}</td><td className="px-4 py-3">{item.contact ?? "-"}</td><td className="px-4 py-3">{item.sortOrder}</td><td className="px-4 py-3 text-right"><Link className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold" href={`/organization/wijk/${item.id}`}><Edit size={15}/>Buka</Link></td></>}</tr>) : <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={tab === "profiles" ? 6 : 5}>Tidak ada data.</td></tr>}</tbody></table></div><Pager hydrated={hydrated} page={page} totalPages={totalPages} total={activeItems.length} count={visible.length} go={go} loading={loading}/></section> : <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><form onSubmit={saveCategory} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_120px_auto]"><Field label="Slug" value={categoryForm.slug} onChange={(value) => setCategoryForm((current) => ({ ...current, slug: value }))}/><Field label="Name" value={categoryForm.name} onChange={(value) => setCategoryForm((current) => ({ ...current, name: value }))}/><Field label="Description" value={categoryForm.description} onChange={(value) => setCategoryForm((current) => ({ ...current, description: value }))}/><Field label="Order" type="number" value={String(categoryForm.sortOrder)} onChange={(value) => setCategoryForm((current) => ({ ...current, sortOrder: Number(value) }))}/><button className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white"><Save size={16}/>Simpan</button></form><div className="mt-5 divide-y divide-slate-200">{categories.map((category) => <div className="py-3" key={category.id}><p className="font-bold text-sm">{category.name}</p><p className="text-xs text-slate-500">/{category.slug}</p></div>)}</div></section>}</div>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm" type={type} value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
function Pager({ hydrated, page, totalPages, total, count, go, loading }: { hydrated: boolean; page: number; totalPages: number; total: number; count: number; go: (next: number) => void; loading: boolean }) { return <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Menampilkan {count ? (page - 1) * 10 + 1 : 0}-{Math.min(page * 10, total)} dari {total} data</p><div className="flex items-center gap-2"><button disabled={hydrated && (page <= 1 || loading)} onClick={() => go(page - 1)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold disabled:opacity-50"><ChevronLeft size={16}/>Prev</button><span className="min-w-24 text-center text-sm font-bold">{page} / {totalPages}</span><button disabled={hydrated && (page >= totalPages || loading)} onClick={() => go(page + 1)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold disabled:opacity-50">Next<ChevronRight size={16}/></button></div></div>; }
