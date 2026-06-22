"use client";

import { ChevronLeft, ChevronRight, Loader2, RefreshCcw, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type FeedbackCategory = "IBADAH" | "PELAYANAN" | "SARANA_PRASARANA" | "LAINNYA";
type FeedbackItem = {
  id: string;
  fullName: string;
  category: FeedbackCategory;
  contactInfo: string | null;
  message: string;
  createdAt: string;
};
type Meta = { page: number; limit: number; total: number };

const categoryLabels: Record<FeedbackCategory, string> = {
  IBADAH: "Ibadah",
  PELAYANAN: "Pelayanan",
  SARANA_PRASARANA: "Sarana & Prasarana",
  LAINNYA: "Lainnya",
};

export function FeedbackClient() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const totalPages = useMemo(() => Math.max(Math.ceil(meta.total / meta.limit), 1), [meta]);

  async function load(next = page) {
    setLoading(true);
    setError("");
    setNotice("");

    const params = new URLSearchParams({ page: String(next), limit: "10" });
    if (search.trim()) params.set("search", search.trim());
    if (category !== "ALL") params.set("category", category);

    try {
      const response = await fetch(`/api/admin/feedback?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat kritik dan saran");
      setItems(result.data);
      setMeta(result.meta);
      setPage(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat kritik dan saran");
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

  async function remove(item: FeedbackItem) {
    if (!confirm(`Hapus kritik dan saran dari ${item.fullName}?`)) return;
    setDeletingId(item.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/feedback/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menghapus kritik dan saran");
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage);
      setNotice(result.message ?? "Kritik dan saran berhasil dihapus");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus kritik dan saran");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="py-6">
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div>
            <h3 className="font-bold">Kritik & Saran Jemaat</h3>
            <p className="mt-1 text-sm text-slate-500">Data masukan yang dikirim melalui form halaman Kontak.</p>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, kontak, atau pesan" />
            </label>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="ALL">Semua kategori</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold">
              <RefreshCcw size={16} />
              Muat
            </button>
          </form>
        </div>

        {notice ? <div className="m-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}
        {error ? <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b px-4 py-3">Tanggal</th>
                <th className="border-b px-4 py-3">Nama</th>
                <th className="border-b px-4 py-3">Kategori</th>
                <th className="border-b px-4 py-3">Kontak</th>
                <th className="border-b px-4 py-3">Pesan</th>
                <th className="border-b px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={6}>
                    <Loader2 className="mr-2 inline animate-spin" size={18} />
                    Memuat
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-950">{item.fullName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{categoryLabels[item.category]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.contactInfo || "-"}</td>
                    <td className="max-w-xl px-4 py-3">
                      <p className="whitespace-pre-line leading-6 text-slate-700">{item.message}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        disabled={deletingId === item.id}
                        onClick={() => remove(item)}
                        type="button"
                      >
                        {deletingId === item.id ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={6}>
                    Belum ada kritik dan saran.
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
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
