"use client";

import { ArrowLeft, CheckCircle2, Loader2, Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type PageSection = {
  title: string;
  body: string;
};

type PageItem = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  description: string;
  summary: string | null;
  callout: string | null;
  layoutVariant: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatus;
  highlights: { text: string }[];
  sections: PageSection[];
};

type PageFormState = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  callout: string;
  layoutVariant: string;
  status: ContentStatus;
  highlights: string[];
  sections: PageSection[];
};

const emptyForm: PageFormState = {
  slug: "",
  title: "",
  eyebrow: "",
  description: "",
  summary: "",
  callout: "",
  layoutVariant: "article",
  status: "DRAFT",
  highlights: [""],
  sections: [{ title: "", body: "" }],
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/ -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-|-$/g, "");
}

function pageToForm(page: PageItem): PageFormState {
  return {
    slug: page.slug,
    title: page.title,
    eyebrow: page.eyebrow ?? "",
    description: page.description,
    summary: page.summary ?? "",
    callout: page.callout ?? "",
    layoutVariant: page.layoutVariant ?? "article",
    status: page.status,
    highlights: page.highlights.length ? page.highlights.map((item) => item.text) : [""],
    sections: page.sections.length ? page.sections.map((item) => ({ title: item.title, body: item.body })) : [{ title: "", body: "" }],
  };
}

function cleanForm(form: PageFormState) {
  return {
    ...form,
    slug: toSlug(form.slug),
    seoTitle: form.title.trim(),
    seoDescription: (form.summary || form.description).trim(),
    highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
    sections: form.sections
      .map((section) => ({ title: section.title.trim(), body: section.body.trim() }))
      .filter((section) => section.title || section.body),
  };
}

export function PageForm({ initialPage, backHref = "/settings?tab=pages" }: { initialPage: PageItem; backHref?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<PageFormState>(initialPage ? pageToForm(initialPage) : emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setField<K extends keyof PageFormState>(key: K, value: PageFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateHighlight(index: number, value: string) {
    setForm((current) => ({
      ...current,
      highlights: current.highlights.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function updateSection(index: number, key: keyof PageSection, value: string) {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }));
  }

  async function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    const payload = cleanForm(form);

    try {
      const response = await fetch(`/api/admin/pages/${initialPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan halaman");

      setMessage(result.message ?? "Halaman tersimpan");
      router.replace(backHref);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan halaman");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={savePage}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950" href={backHref}>
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali ke daftar
            </Link>
            <h3 className="mt-3 text-base font-bold">Read / Update Halaman</h3>
            <p className="mt-1 text-sm text-slate-500">/{initialPage.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white disabled:opacity-70" disabled={isSaving} type="submit">
              {isSaving ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
              Simpan
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-4">
          {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</div> : null}
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Title
              <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onBlur={() => !form.slug && setField("slug", toSlug(form.title))} onChange={(event) => setField("title", event.target.value)} required value={form.title} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Slug
              <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("slug", event.target.value)} placeholder="tentang/sejarah" required value={form.slug} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Eyebrow
              <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("eyebrow", event.target.value)} value={form.eyebrow} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Status
              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("status", event.target.value as ContentStatus)} value={form.status}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </div>

          <TextArea label="Description" required value={form.description} onChange={(value) => setField("description", value)} />
          <TextArea label="Summary" value={form.summary} onChange={(value) => setField("summary", value)} />

          <div className="grid gap-3 rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold">Highlights</h4>
                <p className="mt-1 text-xs text-slate-500">Poin ringkas yang tampil di hero halaman.</p>
              </div>
              <button className="inline-flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => setField("highlights", [...form.highlights, ""])} type="button" aria-label="Tambah highlight">
                <Plus size={17} aria-hidden="true" />
              </button>
            </div>
            {form.highlights.map((highlight, index) => (
              <div className="flex gap-2" key={index}>
                <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => updateHighlight(index, event.target.value)} value={highlight} />
                <button className="inline-flex size-10 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => setField("highlights", form.highlights.filter((_, itemIndex) => itemIndex !== index).length ? form.highlights.filter((_, itemIndex) => itemIndex !== index) : [""])} type="button" aria-label="Hapus highlight">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold">Sections</h4>
                <p className="mt-1 text-xs text-slate-500">Blok artikel/konten utama di halaman publik.</p>
              </div>
              <button className="inline-flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => setField("sections", [...form.sections, { title: "", body: "" }])} type="button" aria-label="Tambah section">
                <Plus size={17} aria-hidden="true" />
              </button>
            </div>
            {form.sections.map((section, index) => (
              <div className="grid gap-2 rounded-md bg-slate-50 p-3" key={index}>
                <div className="flex gap-2">
                  <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => updateSection(index, "title", event.target.value)} placeholder="Judul section" value={section.title} />
                  <button className="inline-flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100" onClick={() => setField("sections", form.sections.filter((_, itemIndex) => itemIndex !== index).length ? form.sections.filter((_, itemIndex) => itemIndex !== index) : [{ title: "", body: "" }])} type="button" aria-label="Hapus section">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <textarea className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => updateSection(index, "body", event.target.value)} placeholder="Isi section" value={section.body} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Layout Variant" value={form.layoutVariant} onChange={(value) => setField("layoutVariant", value)} placeholder="article, wijk, pastors" />
            <Field label="Callout" value={form.callout} onChange={(value) => setField("callout", value)} />
          </div>

          {form.status === "PUBLISHED" ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={14} aria-hidden="true" />
              Tampil di API publik
            </span>
          ) : null}
        </div>
      </section>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function TextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => onChange(event.target.value)} required={required} value={value} />
    </label>
  );
}
