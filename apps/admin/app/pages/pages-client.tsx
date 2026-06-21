"use client";

import { ChevronLeft, ChevronRight, Edit, Loader2, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type PageItem = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  description: string;
  status: ContentStatus;
  updatedAt: string;
  sections: unknown[];
  highlights: unknown[];
};

type Meta = {
  page: number;
  limit: number;
  total: number;
};

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const statusClass: Record<ContentStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

export function PagesClient({ detailBasePath = "/pages", compact = false }: { detailBasePath?: string; compact?: boolean }) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = useMemo(() => Math.max(Math.ceil(meta.total / meta.limit), 1), [meta.limit, meta.total]);

  async function loadPages(page = currentPage) {
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    try {
      const response = await fetch(`/api/admin/pages?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat halaman");
      setPages(result.data);
      setMeta(result.meta ?? { page, limit: 10, total: result.data.length });
      setCurrentPage(page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat halaman");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setHydrated(true);
    loadPages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadPages(1);
  }

  function goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== currentPage) loadPages(nextPage);
  }

  return (
    <div className={compact ? "" : "py-6"}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div>
            <h3 className="text-base font-bold">Daftar Halaman</h3>
            <p className="mt-1 text-sm text-slate-500">10 data per halaman. Buka halaman detail untuk membaca dan mengubah konten.</p>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]" onSubmit={applyFilters}>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" onChange={(event) => setSearch(event.target.value)} placeholder="Cari title, slug, deskripsi" value={search} />
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

        {error ? <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">Title</th>
                <th className="border-b border-slate-200 px-4 py-3">Slug</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-center">Sections</th>
                <th className="border-b border-slate-200 px-4 py-3 text-center">Highlights</th>
                <th className="border-b border-slate-200 px-4 py-3">Updated</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>
                    <Loader2 className="mr-2 inline animate-spin" size={18} aria-hidden="true" />
                    Memuat halaman
                  </td>
                </tr>
              ) : pages.length ? (
                pages.map((page) => (
                  <tr className="align-top transition hover:bg-slate-50" key={page.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-950">{page.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-slate-500">{page.description}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">/{page.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${statusClass[page.status]}`}>{statusLabels[page.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-600">{page.sections.length}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-600">{page.highlights.length}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(page.updatedAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100" href={`${detailBasePath}/${page.id}`}>
                        <Edit size={15} aria-hidden="true" />
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>Tidak ada halaman yang cocok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500">
            Menampilkan {pages.length ? (currentPage - 1) * meta.limit + 1 : 0}-{Math.min(currentPage * meta.limit, meta.total)} dari {meta.total} data
          </p>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-50" disabled={hydrated && (currentPage <= 1 || isLoading)} onClick={() => goToPage(currentPage - 1)} type="button">
              <ChevronLeft size={16} aria-hidden="true" />
              Prev
            </button>
            <span className="min-w-24 text-center text-sm font-bold text-slate-700">{currentPage} / {totalPages}</span>
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-50" disabled={hydrated && (currentPage >= totalPages || isLoading)} onClick={() => goToPage(currentPage + 1)} type="button">
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
