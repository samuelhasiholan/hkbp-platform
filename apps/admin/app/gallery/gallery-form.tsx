"use client";

import { ArrowLeft, Loader2, Save, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Gallery = {
  id: string;
  description: string;
  status: Status;
  media: { url: string };
};

type FormState = {
  description: string;
  imageUrl: string;
  status: Status;
};

const empty: FormState = { description: "", imageUrl: "", status: "DRAFT" };
const toForm = (item: Gallery): FormState => ({
  description: item.description,
  imageUrl: item.media.url,
  status: item.status,
});

export function GalleryForm({ initialItem }: { initialItem?: Gallery }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initialItem ? toForm(initialItem) : empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isEdit = Boolean(initialItem);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice("");
    setError("");

    const data = new FormData();
    data.set("image", file);

    try {
      const response = await fetch("/api/admin/gallery/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal upload gambar");
      update("imageUrl", result.data.url);
      setNotice(result.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(isEdit ? `/api/admin/gallery/${initialItem?.id}` : "/api/admin/gallery", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan galeri");
      setNotice(result.message);
      if (!isEdit) router.replace(`/gallery/${result.data.id}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan galeri");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initialItem || !confirm("Hapus item galeri ini?")) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/gallery/${initialItem.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      router.replace("/gallery");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menghapus galeri");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <Header title={isEdit ? "Read / Update Galeri" : "Create Galeri"} saving={saving} remove={isEdit ? remove : undefined} />
        <div className="grid gap-4 p-4">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}

          {form.imageUrl ? (
            <div className="aspect-[16/7] max-h-72 overflow-hidden rounded-md bg-slate-100">
              <img src={form.imageUrl} alt={form.description} className="h-full w-full object-cover" />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Image URL" value={form.imageUrl} onChange={(value) => update("imageUrl", value)} required />
            <div>
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadImage} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold disabled:opacity-50 md:w-auto"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Browse Image
              </button>
            </div>
          </div>

          <Text label="Description" value={form.description} onChange={(value) => update("description", value)} />
          <Select value={form.status} onChange={(value) => update("status", value as Status)} />
        </div>
      </section>
    </form>
  );
}

function Header({ title, saving, remove }: { title: string; saving: boolean; remove?: () => void }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <ArrowLeft size={16} />
          Kembali ke daftar
        </Link>
        <h3 className="mt-3 font-bold">{title}</h3>
      </div>
      <div className="flex gap-2">
        {remove ? (
          <button type="button" onClick={remove} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700">
            <Trash2 size={16} />
            Hapus
          </button>
        ) : null}
        <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Simpan
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input required={required} className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea required rows={5} className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700 md:max-w-xs">
      Status
      <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        <option>DRAFT</option>
        <option>PUBLISHED</option>
        <option>ARCHIVED</option>
      </select>
    </label>
  );
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return <div className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>;
}
