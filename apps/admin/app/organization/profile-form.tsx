"use client";

import { ArrowLeft, Loader2, Save, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type Category = { id: string; name: string };

export type Profile = {
  id: string;
  categoryId: string | null;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  servicePeriod: string | null;
  sortOrder: number;
  isActive: boolean;
};

type FormState = {
  categoryId: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  servicePeriod: string;
  sortOrder: number;
  isActive: boolean;
};

const empty: FormState = {
  categoryId: "",
  name: "",
  role: "",
  bio: "",
  photoUrl: "",
  servicePeriod: "",
  sortOrder: 0,
  isActive: true,
};

const toForm = (profile: Profile): FormState => ({
  categoryId: profile.categoryId ?? "",
  name: profile.name,
  role: profile.role,
  bio: profile.bio ?? "",
  photoUrl: profile.photoUrl ?? "",
  servicePeriod: profile.servicePeriod ?? "",
  sortOrder: profile.sortOrder,
  isActive: profile.isActive,
});

export function ProfileForm({ categories, initialItem }: { categories: Category[]; initialItem?: Profile }) {
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

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice("");
    setError("");

    const data = new FormData();
    data.set("image", file);

    try {
      const response = await fetch("/api/admin/organization/profiles/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal upload foto");
      update("photoUrl", result.data.url);
      setNotice(result.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal upload foto");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(isEdit ? `/api/admin/organization/profiles/${initialItem?.id}` : "/api/admin/organization/profiles", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: form.categoryId || null, photoUrl: form.photoUrl || null }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan profil");
      setNotice(result.message);
      router.replace("/organization");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initialItem || !confirm(`Hapus profil ${initialItem.name}?`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organization/profiles/${initialItem.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      router.replace("/organization");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menghapus profil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <Header title={isEdit ? "Read / Update Profil" : "Create Profil"} saving={saving} remove={isEdit ? remove : undefined} />
        <div className="grid gap-4 p-4">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}

          {form.photoUrl ? (
            <div className="h-40 w-40 overflow-hidden rounded-md bg-slate-100">
              <img src={form.photoUrl} alt={form.name || "Foto profil"} className="h-full w-full object-cover" />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama" value={form.name} onChange={(value) => update("name", value)} />
            <Field label="Role" value={form.role} onChange={(value) => update("role", value)} />
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Kategori
              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 text-sm font-semibold text-slate-700">
              Photo URL
              <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={uploadPhoto} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold disabled:opacity-50"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                Browse
              </button>
              {form.photoUrl ? <p className="truncate text-xs font-normal text-slate-500">{form.photoUrl}</p> : null}
            </div>
            <Field label="Masa Tugas" value={form.servicePeriod} onChange={(value) => update("servicePeriod", value)} required={false} />
            <Field label="Sort Order" type="number" value={String(form.sortOrder)} onChange={(value) => update("sortOrder", Number(value))} />
            <label className="flex items-center gap-2 pt-7 text-sm font-bold">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} /> Aktif
            </label>
          </div>
          <Text label="Bio" value={form.bio} onChange={(value) => update("bio", value)} />
        </div>
      </section>
    </form>
  );
}

function Header({ title, saving, remove }: { title: string; saving: boolean; remove?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 p-4">
      <div>
        <Link href="/organization" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
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

function Field({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input required={required} className="h-10 rounded-md border border-slate-300 px-3 text-sm" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea rows={6} className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return <div className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>;
}
