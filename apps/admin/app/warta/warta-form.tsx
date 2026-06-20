"use client";

import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type PdfVersion = { language: "INDONESIA" | "BATAK"; label: string; fileUrl: string; fileName: string };
export type Warta = { id: string; slug: string; title: string; date: string; liturgicalColor: string; theme: string; preacher: string; excerpt: string; isCurrent: boolean; status: Status; pdfVersions: PdfVersion[] };
type FormState = Omit<Warta, "id" | "date"> & { date: string };
const empty: FormState = { slug: "", title: "", date: new Date().toISOString().slice(0, 10), liturgicalColor: "Hijau", theme: "", preacher: "Pdt. Resort", excerpt: "", isCurrent: false, status: "DRAFT", pdfVersions: [{ language: "INDONESIA", label: "Bahasa Indonesia", fileUrl: "", fileName: "" }, { language: "BATAK", label: "Bahasa Batak", fileUrl: "", fileName: "" }] };
const toSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const toForm = (item: Warta): FormState => ({ ...item, date: item.date.slice(0, 10), pdfVersions: ["INDONESIA", "BATAK"].map((language) => item.pdfVersions.find((pdf) => pdf.language === language) ?? { language: language as "INDONESIA" | "BATAK", label: language === "INDONESIA" ? "Bahasa Indonesia" : "Bahasa Batak", fileUrl: "", fileName: "" }) });

export function WartaForm({ initialItem }: { initialItem?: Warta }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialItem ? toForm(initialItem) : empty);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isEdit = Boolean(initialItem);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function updatePdf(index: number, key: keyof PdfVersion, value: string) { setForm((current) => ({ ...current, pdfVersions: current.pdfVersions.map((pdf, itemIndex) => itemIndex === index ? { ...pdf, [key]: value } : pdf) })); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice(""); setError("");
    const payload = { ...form, slug: toSlug(form.slug || form.title), date: new Date(form.date).toISOString(), pdfVersions: form.pdfVersions.filter((pdf) => pdf.fileUrl && pdf.fileName) };
    try { const response = await fetch(isEdit ? `/api/admin/warta/${initialItem?.id}` : "/api/admin/warta", { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan warta"); setNotice(result.message); if (!isEdit) router.replace(`/warta/${result.data.id}`); router.refresh(); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan warta"); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!initialItem || !confirm(`Hapus warta "${initialItem.title}"?`)) return;
    setSaving(true);
    try { const response = await fetch(`/api/admin/warta/${initialItem.id}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message); router.replace("/warta"); router.refresh(); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus warta"); }
    finally { setSaving(false); }
  }

  return <form className="py-6" onSubmit={save}><section className="rounded-md border border-slate-200 bg-white shadow-sm"><Header title={isEdit ? "Read / Update Warta" : "Create Warta"} saving={saving} remove={isEdit ? remove : undefined}/><div className="grid gap-4 p-4">{notice ? <Alert tone="good" text={notice}/> : null}{error ? <Alert tone="bad" text={error}/> : null}<div className="grid gap-4 md:grid-cols-2"><Field label="Title" value={form.title} onChange={(value) => update("title", value)} onBlur={() => !form.slug && update("slug", toSlug(form.title))}/><Field label="Slug" value={form.slug} onChange={(value) => update("slug", value)}/><Field label="Tanggal" type="date" value={form.date} onChange={(value) => update("date", value)}/><Field label="Warna Liturgi" value={form.liturgicalColor} onChange={(value) => update("liturgicalColor", value)}/><Field label="Tema" value={form.theme} onChange={(value) => update("theme", value)}/><Field label="Pengkhotbah" value={form.preacher} onChange={(value) => update("preacher", value)}/><Select value={form.status} onChange={(value) => update("status", value as Status)}/><label className="flex items-center gap-2 pt-7 text-sm font-bold"><input type="checkbox" checked={form.isCurrent} onChange={(event) => update("isCurrent", event.target.checked)}/> Jadikan warta aktif</label></div><Text label="Excerpt" value={form.excerpt} onChange={(value) => update("excerpt", value)}/><div className="grid gap-3 rounded-md border border-slate-200 p-4"><h4 className="text-sm font-bold">PDF Versions</h4>{form.pdfVersions.map((pdf, index) => <div key={pdf.language} className="grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-2"><Field label="Label" value={pdf.label} onChange={(value) => updatePdf(index, "label", value)}/><Field label="File Name" value={pdf.fileName} onChange={(value) => updatePdf(index, "fileName", value)}/><label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">{pdf.language} URL<input className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={pdf.fileUrl} onChange={(event) => updatePdf(index, "fileUrl", event.target.value)} placeholder="/warta/file.pdf"/></label></div>)}</div></div></section></form>;
}
function Header({ title, saving, remove }: { title: string; saving: boolean; remove?: () => void }) { return <div className="flex items-center justify-between border-b border-slate-200 p-4"><div><Link href="/warta" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={16}/>Kembali ke daftar</Link><h3 className="mt-3 font-bold">{title}</h3></div><div className="flex gap-2">{remove ? <button type="button" onClick={remove} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700"><Trash2 size={16}/>Hapus</button> : null}<button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white">{saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}Simpan</button></div></div>; }
function Field({ label, value, onChange, type = "text", onBlur }: { label: string; value: string; onChange: (value: string) => void; type?: string; onBlur?: () => void }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<input required className="h-10 rounded-md border border-slate-300 px-3 text-sm" type={type} value={value} onBlur={onBlur} onChange={(event) => onChange(event.target.value)}/></label>; }
function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<textarea required rows={4} className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
function Select({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold text-slate-700">Status<select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>; }
function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) { return <div className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>; }
