"use client";

import { ChevronLeft, ChevronRight, Edit, FilePlus2, Loader2, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Gallery = {
  id: string;
  description: string;
  status: Status;
  updatedAt: string;
  media: { url: string };
};
type Meta = { page: number; limit: number; total: number };

export function GalleryClient() {
  const [items, setItems] = useState<Gallery[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalPages = useMemo(() => Math.max(Math.ceil(meta.total / meta.limit), 1), [meta]);

  async function load(next = page) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ page: String(next), limit: "10" });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    try {
      const response = await fetch(`/api/admin/gallery?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat galeri");
      setItems(result.data);
      setMeta(result.meta);
      setPage(next);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal memuat galeri");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHydrated(true);
    load(1);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    load(1);
  }

  function go(nextPage: number) {
    const next = Math.min(Math.max(nextPage, 1), totalPages);
    if (next !== page) load(next);
  }

  return (
    <div className="py-6">
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold">Daftar Galeri</h3>
              <p className="mt-1 text-sm text-slate-500">10 data per halaman. Buka detail untuk read/update.</p>
            </div>
            <Link href="/gallery/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white">
              <FilePlus2 size={17} />
              Buat Galeri
            </Link>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]" onSubmit={submit}>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari deskripsi atau URL gambar" />
            </label>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">Semua status</option>
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>ARCHIVED</option>
            </select>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold">
              <RefreshCcw size={16} />
              Muat
            </button>
          </form>
        </div>

        {error ? <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b px-4 py-3">Image</th>
                <th className="border-b px-4 py-3">Description</th>
                <th className="border-b px-4 py-3">Image URL</th>
                <th className="border-b px-4 py-3">Status</th>
                <th className="border-b px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={5}>
                    <Loader2 className="mr-2 inline animate-spin" size={18} />
                    Memuat
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="h-14 w-20 overflow-hidden rounded-md bg-slate-100">
                        {item.media.url ? <img src={item.media.url} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="line-clamp-2 font-semibold leading-6">{item.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate text-xs text-slate-500">{item.media.url}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold" href={`/gallery/${item.id}`}>
                        <Edit size={15} />
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={5}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pager hydrated={hydrated} page={page} totalPages={totalPages} meta={meta} count={items.length} go={go} loading={loading} />
      </section>
    </div>
  );
}

function Pager({ hydrated, page, totalPages, meta, count, go, loading }: { hydrated: boolean; page: number; totalPages: number; meta: Meta; count: number; go: (nextPage: number) => void; loading: boolean }) {
  return (
    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Menampilkan {count ? (page - 1) * meta.limit + 1 : 0}-{Math.min(page * meta.limit, meta.total)} dari {meta.total} data
      </p>
      <div className="flex items-center gap-2">
        <button disabled={hydrated && (page <= 1 || loading)} onClick={() => go(page - 1)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold disabled:opacity-50">
          <ChevronLeft size={16} />
          Prev
        </button>
        <span className="min-w-24 text-center text-sm font-bold">
          {page} / {totalPages}
        </span>
        <button disabled={hydrated && (page >= totalPages || loading)} onClick={() => go(page + 1)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold disabled:opacity-50">
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
