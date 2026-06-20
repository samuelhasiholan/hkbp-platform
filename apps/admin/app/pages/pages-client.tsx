"use client";

import { Archive, CheckCircle2, FilePlus2, Loader2, Plus, RefreshCcw, Save, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type PageSection = {
  id?: string;
  title: string;
  body: string;
  sortOrder?: number;
};

type PageHighlight = {
  id?: string;
  text: string;
  sortOrder?: number;
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
  highlights: PageHighlight[];
  sections: PageSection[];
  updatedAt: string;
};

type PageForm = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  callout: string;
  layoutVariant: string;
  seoTitle: string;
  seoDescription: string;
  status: ContentStatus;
  highlights: string[];
  sections: PageSection[];
};

const emptyForm: PageForm = {
  slug: "",
  title: "",
  eyebrow: "",
  description: "",
  summary: "",
  callout: "",
  layoutVariant: "article",
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
  highlights: [""],
  sections: [{ title: "", body: "" }],
};

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/ -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/, "/")
    .replace(/^-|-$/g, "");
}

function pageToForm(page: PageItem): PageForm {
  return {
    slug: page.slug,
    title: page.title,
    eyebrow: page.eyebrow ?? "",
    description: page.description,
    summary: page.summary ?? "",
    callout: page.callout ?? "",
    layoutVariant: page.layoutVariant ?? "article",
    seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "",
    status: page.status,
    highlights: page.highlights.length ? page.highlights.map((item) => item.text) : [""],
    sections: page.sections.length ? page.sections.map((item) => ({ title: item.title, body: item.body })) : [{ title: "", body: "" }],
  };
}

function cleanForm(form: PageForm) {
  return {
    ...form,
    slug: toSlug(form.slug),
    highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
    sections: form.sections
      .map((section) => ({ title: section.title.trim(), body: section.body.trim() }))
      .filter((section) => section.title || section.body),
  };
}

export function PagesClient() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedId) ?? null, [pages, selectedId]);

  async function loadPages() {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "50" });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    try {
      const response = await fetch(`/api/admin/pages?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat halaman");
      setPages(result.data);
      if (selectedId && !result.data.some((page: PageItem) => page.id === selectedId)) {
        setSelectedId(null);
        setForm(emptyForm);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat halaman");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPage(page: PageItem) {
    setSelectedId(page.id);
    setForm(pageToForm(page));
    setMessage("");
    setError("");
  }

  function startCreate() {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function setField<K extends keyof PageForm>(key: K, value: PageForm[K]) {
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
      const response = await fetch(selectedId ? `/api/admin/pages/${selectedId}` : "/api/admin/pages", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan halaman");

      setMessage(result.message ?? "Halaman tersimpan");
      setSelectedId(result.data.id);
      setForm(pageToForm(result.data));
      await loadPages();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan halaman");
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePage() {
    if (!selectedId || !selectedPage) return;
    const confirmed = window.confirm(`Hapus halaman "${selectedPage.title}"? Halaman akan diarsipkan dan tidak tampil di daftar aktif.`);
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pages/${selectedId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menghapus halaman");
      setMessage(result.message ?? "Halaman dihapus");
      startCreate();
      await loadPages();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus halaman");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 py-6 xl:grid-cols-[0.95fr_1.3fr]">
      <section className="min-w-0 rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold">Daftar Halaman</h3>
              <p className="mt-1 text-sm text-slate-500">Kelola konten yang sebelumnya berada di data statis frontend.</p>
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white" onClick={startCreate} type="button">
              <FilePlus2 size={17} aria-hidden="true" />
              Baru
            </button>
          </div>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]" onSubmit={(event) => { event.preventDefault(); loadPages(); }}>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setSearch(event.target.value)} placeholder="Cari title atau slug" value={search} />
            </label>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="ALL">Semua status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-100" type="submit">
              <RefreshCcw size={16} aria-hidden="true" />
              Muat
            </button>
          </form>
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-auto">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-sm font-medium text-slate-500">
              <Loader2 className="mr-2 animate-spin" size={18} aria-hidden="true" />
              Memuat halaman
            </div>
          ) : pages.length ? (
            <div className="divide-y divide-slate-200">
              {pages.map((page) => (
                <button className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 ${page.id === selectedId ? "bg-sky-50" : "bg-white"}`} key={page.id} onClick={() => selectPage(page)} type="button">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{page.title}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">/{page.slug}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${page.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : page.status === "ARCHIVED" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>
                      {statusLabels[page.status]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{page.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-slate-500">Belum ada halaman yang cocok dengan filter.</div>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-md border border-slate-200 bg-white shadow-sm">
        <form onSubmit={savePage}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold">{selectedId ? "Edit Halaman" : "Buat Halaman"}</h3>
              <p className="mt-1 text-sm text-slate-500">Isi konten utama, highlight, section, dan metadata SEO.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedId ? (
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-bold text-red-700 hover:bg-red-50" disabled={isSaving} onClick={deletePage} type="button">
                  <Trash2 size={16} aria-hidden="true" />
                  Hapus
                </button>
              ) : null}
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
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("slug", event.target.value)} placeholder="tentang-gereja/sejarah" required value={form.slug} />
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

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Description
              <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("description", event.target.value)} required value={form.description} />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Summary
              <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("summary", event.target.value)} value={form.summary} />
            </label>

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
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Layout Variant
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("layoutVariant", event.target.value)} placeholder="article, wijk, pastors" value={form.layoutVariant} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Callout
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("callout", event.target.value)} value={form.callout} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                SEO Title
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("seoTitle", event.target.value)} value={form.seoTitle} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                SEO Description
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setField("seoDescription", event.target.value)} value={form.seoDescription} />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
              <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                <Archive size={14} aria-hidden="true" />
                {selectedId ? "Mode edit" : "Mode create"}
              </span>
              {form.status === "PUBLISHED" ? (
                <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Tampil di API publik
                </span>
              ) : null}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
