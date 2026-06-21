"use client";

import { ArrowLeft, FileUp, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type PdfVersion = { language: "INDONESIA" | "BATAK"; label: string; fileUrl: string; fileName: string };
export type Warta = { id: string; slug: string; title: string; date: string; isCurrent: boolean; status: Status; pdfVersions: PdfVersion[] };
type FormState = Omit<Warta, "id" | "slug" | "date"> & { date: string };

const pdfDefaults: PdfVersion[] = [
  { language: "INDONESIA", label: "Bahasa Indonesia", fileUrl: "", fileName: "" },
  { language: "BATAK", label: "Bahasa Batak", fileUrl: "", fileName: "" },
];

const empty: FormState = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  isCurrent: false,
  status: "DRAFT",
  pdfVersions: pdfDefaults,
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const makeWartaSlug = (title: string, date: string) => toSlug(`${title} ${date}`);

const defaultPdfFor = (language: PdfVersion["language"]) =>
  pdfDefaults.find((pdf) => pdf.language === language) ?? pdfDefaults[0];

const toForm = (item: Warta): FormState => ({
  title: item.title,
  date: item.date.slice(0, 10),
  isCurrent: item.isCurrent,
  status: item.status,
  pdfVersions: (["INDONESIA", "BATAK"] as const).map((language) => ({
    ...defaultPdfFor(language),
    ...item.pdfVersions.find((pdf) => pdf.language === language),
    language,
    label: defaultPdfFor(language).label,
  })),
});

export function WartaForm({ initialItem }: { initialItem?: Warta }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialItem ? toForm(initialItem) : empty);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isEdit = Boolean(initialItem);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePdf(index: number, value: Pick<PdfVersion, "fileName" | "fileUrl">) {
    setForm((current) => ({
      ...current,
      pdfVersions: current.pdfVersions.map((pdf, itemIndex) => (itemIndex === index ? { ...pdf, ...value } : pdf)),
    }));
  }

  async function uploadPdf(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("File warta harus berformat PDF");
      return;
    }

    setUploadingIndex(index);
    setError("");
    setNotice("");

    try {
      const payload = new FormData();
      payload.append("pdf", file);
      const response = await fetch("/api/admin/warta/upload", { method: "POST", body: payload });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal mengupload PDF");
      updatePdf(index, { fileUrl: result.data.url, fileName: result.data.fileName });
      setNotice("PDF berhasil diupload");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Gagal mengupload PDF");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    const payload = {
      ...form,
      slug: makeWartaSlug(form.title, form.date),
      date: new Date(form.date).toISOString(),
      pdfVersions: form.pdfVersions.filter((pdf) => pdf.fileUrl && pdf.fileName),
    };

    try {
      const response = await fetch(isEdit ? `/api/admin/warta/${initialItem?.id}` : "/api/admin/warta", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan warta");
      setNotice(result.message);
      router.replace("/warta");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan warta");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initialItem || !confirm(`Hapus warta "${initialItem.title}"?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/warta/${initialItem.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      router.replace("/warta");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus warta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <Header title={isEdit ? "Read / Update Warta" : "Create Warta"} saving={saving} remove={isEdit ? remove : undefined} />
        <div className="grid gap-4 p-4">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(value) => update("title", value)} />
            <Field label="Tanggal" type="date" value={form.date} onChange={(value) => update("date", value)} />
            <Select value={form.status} onChange={(value) => update("status", value as Status)} />
            <label className="flex items-center gap-2 pt-7 text-sm font-bold">
              <input type="checkbox" checked={form.isCurrent} onChange={(event) => update("isCurrent", event.target.checked)} /> Jadikan warta aktif
            </label>
          </div>

          <div className="grid gap-3 rounded-md border border-slate-200 p-4">
            <h4 className="text-sm font-bold">PDF Versions</h4>
            {form.pdfVersions.map((pdf, index) => (
              <div key={pdf.language} className="grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_1.4fr]">
                <ReadOnlyField label="Label" value={pdf.label} />
                <PdfUploadField
                  fileName={pdf.fileName}
                  inputId={`warta-pdf-${pdf.language}`}
                  label="File PDF"
                  loading={uploadingIndex === index}
                  onChange={(event) => uploadPdf(index, event)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </form>
  );
}

function Header({ title, saving, remove }: { title: string; saving: boolean; remove?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 p-4">
      <div>
        <Link href="/warta" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
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

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input required className="h-10 rounded-md border border-slate-300 px-3 text-sm" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input readOnly className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-600" value={value} />
    </label>
  );
}

function PdfUploadField({ fileName, inputId, label, loading, onChange }: { fileName: string; inputId: string; label: string; loading: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input readOnly className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-600" value={fileName || "Belum ada file"} />
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
          Browse
          <input id={inputId} type="file" accept="application/pdf,.pdf" className="sr-only" disabled={loading} onChange={onChange} />
        </label>
      </div>
    </div>
  );
}

function Select({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
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
