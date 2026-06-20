"use client";

import { Loader2, RefreshCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type PastorGreeting = {
  eyebrow: string;
  title: string;
  body: string;
  pastorName: string;
  pastorRole: string;
  photoUrl: string;
};

type Settings = {
  pastorGreeting: PastorGreeting;
};

const emptyGreeting: PastorGreeting = {
  eyebrow: "Sambutan Pendeta",
  title: "Horas, selamat datang di HKBP Resort Srengseng Sawah",
  body: "Dengan penuh sukacita kami menyambut setiap jemaat dan pengunjung yang hadir melalui ruang digital ini. Kiranya informasi pelayanan, ibadah, dan persekutuan yang tersedia menolong kita semakin bertumbuh dalam iman, kasih, dan pengharapan di dalam Kristus.",
  pastorName: "Pdt. HKBP Resort Srengseng Sawah",
  pastorRole: "Pendeta Resort",
  photoUrl: "",
};

export function SettingsClient() {
  const [form, setForm] = useState<PastorGreeting>(emptyGreeting);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal memuat settings");
      const settings = result.data as Settings;
      setForm({ ...emptyGreeting, ...settings.pastorGreeting });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal memuat settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function update<K extends keyof PastorGreeting>(key: K, value: PastorGreeting[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastorGreeting: form }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan settings");
      setNotice(result.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="py-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Sambutan Pendeta</h3>
            <p className="mt-1 text-sm text-slate-500">Konten ini tampil di bawah Hero halaman Beranda.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadSettings} disabled={loading || saving} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Muat
            </button>
            <button disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" value={form.eyebrow} onChange={(value) => update("eyebrow", value)} required />
            <Field label="Nama Pendeta" value={form.pastorName} onChange={(value) => update("pastorName", value)} required />
            <Field label="Jabatan" value={form.pastorRole} onChange={(value) => update("pastorRole", value)} required />
            <Field label="Photo URL" value={form.photoUrl} onChange={(value) => update("photoUrl", value)} />
          </div>

          <Field label="Judul" value={form.title} onChange={(value) => update("title", value)} required />
          <Text label="Isi Sambutan" value={form.body} onChange={(value) => update("body", value)} />
        </div>
      </section>
    </form>
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
      <textarea required rows={7} className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return <div className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>;
}
