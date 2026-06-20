"use client";

import { FilePlus2, Loader2, RefreshCcw, Save, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Category = "BERITA_KEGIATAN" | "ARTIKEL_RENUNGAN" | "PUBLIKASI_RESMI";
type Publication = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  content: string[];
  author: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  thumbnailTone: string | null;
  readTime: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: Status;
};
type FormState = Omit<Publication, "id" | "content" | "publishedAt"> & { contentText: string; publishedAt: string };

const emptyForm: FormState = {
  slug: "",
  title: "",
  category: "BERITA_KEGIATAN",
  excerpt: "",
  contentText: "",
  author: "Tim Publikasi",
  publishedAt: new Date().toISOString().slice(0, 10),
  thumbnailUrl: "",
  thumbnailTone: "",
  readTime: "3 menit baca",
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
};
const categories: { value: Category; label: string }[] = [
  { value: "BERITA_KEGIATAN", label: "Berita Kegiatan" },
  { value: "ARTIKEL_RENUNGAN", label: "Artikel dan Renungan" },
  { value: "PUBLIKASI_RESMI", label: "Publikasi Resmi" },
];
const statuses: Status[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const toSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const toForm = (item: Publication): FormState => ({ ...item, publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "", contentText: item.content.join("\n\n"), thumbnailUrl: item.thumbnailUrl ?? "", thumbnailTone: item.thumbnailTone ?? "", readTime: item.readTime ?? "", seoTitle: item.seoTitle ?? "", seoDescription: item.seoDescription ?? "" });

export function PublicationsClient() {
  const [items, setItems] = useState<Publication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (category !== "ALL") params.set("category", category);
    try {
      const response = await fetch(`/api/admin/publications?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat publikasi");
      setItems(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat publikasi");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function createNew() { setSelectedId(null); setForm(emptyForm); setNotice(""); setError(""); }
  function select(item: Publication) { setSelectedId(item.id); setForm(toForm(item)); setNotice(""); setError(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice(""); setError("");
    const payload = { ...form, slug: toSlug(form.slug || form.title), publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null, content: form.contentText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) };
    try {
      const response = await fetch(selectedId ? `/api/admin/publications/${selectedId}` : "/api/admin/publications", { method: selectedId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan publikasi");
      setSelectedId(result.data.id); setForm(toForm(result.data)); setNotice(result.message); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan publikasi"); } finally { setSaving(false); }
  }
  async function remove() {
    if (!selectedId || !selected || !confirm(`Hapus publikasi "${selected.title}"?`)) return;
    setSaving(true);
    try { const response = await fetch(`/api/admin/publications/${selectedId}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message); createNew(); setNotice("Publikasi dihapus"); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal menghapus publikasi"); } finally { setSaving(false); }
  }

  return <div className="grid gap-6 py-6 xl:grid-cols-[0.95fr_1.3fr]">
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Daftar Publikasi</h3><p className="mt-1 text-sm text-slate-500">Berita, artikel, renungan, dan publikasi resmi.</p></div><button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white" onClick={createNew}><FilePlus2 size={17}/>Baru</button></div>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_150px_170px_auto]" onSubmit={(e) => { e.preventDefault(); load(); }}><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" placeholder="Cari publikasi" value={search} onChange={(e)=>setSearch(e.target.value)}/></label><select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="ALL">Semua</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select><select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="ALL">Semua kategori</option>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select><button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold"><RefreshCcw size={16}/>Muat</button></form>
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-auto divide-y divide-slate-200">{loading ? <div className="p-8 text-center text-sm text-slate-500"><Loader2 className="inline animate-spin" size={18}/> Memuat</div> : items.map(item => <button key={item.id} onClick={()=>select(item)} className={`block w-full p-4 text-left hover:bg-slate-50 ${item.id===selectedId?'bg-sky-50':''}`}><div className="flex justify-between gap-3"><p className="font-bold text-sm">{item.title}</p><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">/{item.slug}</p><p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.excerpt}</p></button>)}</div>
    </section>
    <section className="rounded-md border border-slate-200 bg-white shadow-sm"><form onSubmit={save}><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><h3 className="font-bold">{selectedId ? "Edit Publikasi" : "Buat Publikasi"}</h3><p className="mt-1 text-sm text-slate-500">Pisahkan paragraf konten dengan baris kosong.</p></div><div className="flex gap-2">{selectedId ? <button type="button" onClick={remove} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700"><Trash2 size={16}/>Hapus</button> : null}<button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white">{saving?<Loader2 className="animate-spin" size={16}/>:<Save size={16}/>}Simpan</button></div></div>
      <div className="grid gap-4 p-4">{notice?<div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>:null}{error?<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>:null}<div className="grid gap-4 md:grid-cols-2"><Field label="Title" value={form.title} onChange={(v)=>update('title',v)} onBlur={()=>!form.slug&&update('slug',toSlug(form.title))} required/><Field label="Slug" value={form.slug} onChange={(v)=>update('slug',v)} required/><Select label="Kategori" value={form.category} onChange={(v)=>update('category',v as Category)} options={categories}/><Select label="Status" value={form.status} onChange={(v)=>update('status',v as Status)} options={statuses.map(s=>({value:s,label:s}))}/><Field label="Author" value={form.author} onChange={(v)=>update('author',v)} required/><Field label="Tanggal Publish" type="date" value={form.publishedAt} onChange={(v)=>update('publishedAt',v)}/><Field label="Read Time" value={form.readTime ?? ''} onChange={(v)=>update('readTime',v)}/><Field label="Thumbnail URL" value={form.thumbnailUrl ?? ''} onChange={(v)=>update('thumbnailUrl',v)}/></div><Text label="Excerpt" value={form.excerpt} onChange={(v)=>update('excerpt',v)} required/><Text label="Content" value={form.contentText} onChange={(v)=>update('contentText',v)} rows={10}/><div className="grid gap-4 md:grid-cols-2"><Field label="SEO Title" value={form.seoTitle ?? ''} onChange={(v)=>update('seoTitle',v)}/><Field label="SEO Description" value={form.seoDescription ?? ''} onChange={(v)=>update('seoDescription',v)}/></div></div></form></section>
  </div>;
}
function Field({label,value,onChange,type='text',required,onBlur}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean;onBlur?:()=>void}){return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<input className="h-10 rounded-md border border-slate-300 px-3 text-sm" type={type} value={value} required={required} onBlur={onBlur} onChange={(e)=>onChange(e.target.value)}/></label>}
function Text({label,value,onChange,rows=4,required}:{label:string;value:string;onChange:(v:string)=>void;rows?:number;required?:boolean}){return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<textarea className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" rows={rows} value={value} required={required} onChange={(e)=>onChange(e.target.value)}/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
