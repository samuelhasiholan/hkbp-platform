"use client";

import { Loader2, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PastorGreeting = {
  eyebrow: string;
  title: string;
  body: string;
  pastorProfileId: string;
  pastorName: string;
  pastorRole: string;
  photoUrl: string;
};

type Settings = {
  siteIdentity: SiteIdentity;
  contactInfo: ContactInfo;
  socialLinks: SocialLink[];
  seoDefaults: SeoDefaults;
  footerSettings: FooterSettings;
  homeHero: HomeHero;
  pastorGreeting: PastorGreeting;
  churchHistoryTimeline: HistoryTimelineItem[];
};

type SiteIdentity = {
  siteName: string;
  denomination: string;
  logoUrl: string;
};

type ContactInfo = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  officeHours: string;
};

type SocialLink = {
  label: string;
  url: string;
};

type SeoDefaults = {
  title: string;
  description: string;
  ogImageUrl: string;
};

type FooterSettings = {
  description: string;
  copyrightText: string;
};

type HomeHero = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

type HistoryTimelineItem = {
  year: string;
  title: string;
};

type Category = {
  id: string;
  slug: string;
  name: string;
};

type Profile = {
  id: string;
  categoryId: string | null;
  name: string;
  role: string;
  photoUrl: string | null;
  isActive: boolean;
  category?: Category | null;
};

const emptyGreeting: PastorGreeting = {
  eyebrow: "Sambutan Pendeta",
  title: "Horas, selamat datang di HKBP Resort Srengseng Sawah",
  body: "Dengan penuh sukacita kami menyambut setiap jemaat dan pengunjung yang hadir melalui ruang digital ini. Kiranya informasi pelayanan, ibadah, dan persekutuan yang tersedia menolong kita semakin bertumbuh dalam iman, kasih, dan pengharapan di dalam Kristus.",
  pastorProfileId: "",
  pastorName: "Pdt. HKBP Resort Srengseng Sawah",
  pastorRole: "Pendeta Resort",
  photoUrl: "",
};
const defaultSiteIdentity: SiteIdentity = {
  siteName: "HKBP Resort Srengseng Sawah",
  denomination: "Huria Kristen Batak Protestan",
  logoUrl: "",
};
const defaultContactInfo: ContactInfo = {
  address: "Gg. Amalia Jl. Srengseng Sawah No.4, RT.3/RW.3, Srengseng Sawah, Kec. Jagakarsa, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12630",
  phone: "08xx-xxxx-xxxx",
  whatsapp: "",
  email: "admin@hkbp.or.id",
  officeHours: "Senin - Sabtu, 09.00 - 16.00 WIB",
};
const defaultSeoDefaults: SeoDefaults = {
  title: "HKBP Resort Srengseng Sawah",
  description: "Website HKBP Resort Srengseng Sawah untuk informasi ibadah, pelayanan, warta, berita, dan kontak gereja.",
  ogImageUrl: "",
};
const defaultFooterSettings: FooterSettings = {
  description: "Website jemaat untuk informasi ibadah, warta, berita, dan pelayanan gereja.",
  copyrightText: "",
};
const defaultHomeHero: HomeHero = {
  eyebrow: "Website Resmi",
  title: "HKBP Resort Srengseng Sawah",
  description: "Pusat informasi ibadah, pelayanan, warta jemaat, berita, dan kontak gereja untuk mendukung kehidupan persekutuan.",
  primaryLabel: "Lihat Jadwal Ibadah",
  primaryHref: "/pelayanan/jadwal-pelayanan#ibadah-minggu",
  secondaryLabel: "Baca Warta",
  secondaryHref: "/warta/warta-mingguan",
};
const GREETING_BODY_MAX_LENGTH = 600;
const defaultTimeline: HistoryTimelineItem[] = [
  { year: "1966", title: "HKBP Srengseng Sawah didirikan" },
  { year: "2016", title: "Jubileum 50 tahun" },
  { year: "2017", title: "Peresmian gedung gereja baru" },
  { year: "2026", title: "Pembangunan gereja tahap 1" },
];
const yearOptions = Array.from({ length: 301 }, (_, index) => String(2100 - index));

function isPastorCategory(category?: Category | null) {
  return category?.slug === "pendeta" || category?.name.toLowerCase() === "pendeta";
}

export function SettingsClient() {
  const [siteIdentity, setSiteIdentity] = useState<SiteIdentity>(defaultSiteIdentity);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaults>(defaultSeoDefaults);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultFooterSettings);
  const [homeHero, setHomeHero] = useState<HomeHero>(defaultHomeHero);
  const [form, setForm] = useState<PastorGreeting>(emptyGreeting);
  const [timeline, setTimeline] = useState<HistoryTimelineItem[]>(defaultTimeline);
  const [pastors, setPastors] = useState<Profile[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedPastor = useMemo(() => pastors.find((pastor) => pastor.id === form.pastorProfileId) ?? null, [form.pastorProfileId, pastors]);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const [settingsResponse, profilesResponse] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/organization/profiles", { cache: "no-store" }),
      ]);
      const [settingsResult, profilesResult] = await Promise.all([settingsResponse.json(), profilesResponse.json()]);
      if (!settingsResponse.ok || !settingsResult.success) throw new Error(settingsResult.message ?? "Gagal memuat settings");
      if (!profilesResponse.ok || !profilesResult.success) throw new Error(profilesResult.message ?? "Gagal memuat profil pelayanan");

      const settings = settingsResult.data as Settings;
      const pastorOptions = (profilesResult.data as Profile[]).filter((profile) => profile.isActive && isPastorCategory(profile.category));
      const currentGreeting = { ...emptyGreeting, ...settings.pastorGreeting };
      const matchedPastor = pastorOptions.find((pastor) => pastor.id === currentGreeting.pastorProfileId) ?? pastorOptions.find((pastor) => pastor.name === currentGreeting.pastorName);

      setSiteIdentity({ ...defaultSiteIdentity, ...settings.siteIdentity });
      setContactInfo({ ...defaultContactInfo, ...settings.contactInfo });
      setSocialLinks(settings.socialLinks ?? []);
      setSeoDefaults({ ...defaultSeoDefaults, ...settings.seoDefaults });
      setFooterSettings({ ...defaultFooterSettings, ...settings.footerSettings });
      setHomeHero({ ...defaultHomeHero, ...settings.homeHero });
      setPastors(pastorOptions);
      setTimeline(settings.churchHistoryTimeline?.length ? settings.churchHistoryTimeline : defaultTimeline);
      setForm({
        ...currentGreeting,
        pastorProfileId: matchedPastor?.id ?? currentGreeting.pastorProfileId,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal memuat settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHydrated(true);
    loadSettings();
  }, []);

  function update<K extends keyof PastorGreeting>(key: K, value: PastorGreeting[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSiteIdentity<K extends keyof SiteIdentity>(key: K, value: SiteIdentity[K]) {
    setSiteIdentity((current) => ({ ...current, [key]: value }));
  }

  function updateContactInfo<K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) {
    setContactInfo((current) => ({ ...current, [key]: value }));
  }

  function updateSeoDefaults<K extends keyof SeoDefaults>(key: K, value: SeoDefaults[K]) {
    setSeoDefaults((current) => ({ ...current, [key]: value }));
  }

  function updateFooterSettings<K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) {
    setFooterSettings((current) => ({ ...current, [key]: value }));
  }

  function updateHomeHero<K extends keyof HomeHero>(key: K, value: HomeHero[K]) {
    setHomeHero((current) => ({ ...current, [key]: value }));
  }

  function updateSocialLink(index: number, key: keyof SocialLink, value: string) {
    setSocialLinks((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function addSocialLink() {
    setSocialLinks((current) => [...current, { label: "", url: "" }]);
  }

  function removeSocialLink(index: number) {
    setSocialLinks((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateTimeline(index: number, key: keyof HistoryTimelineItem, value: string) {
    setTimeline((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function addTimelineItem() {
    setTimeline((current) => [...current, { year: "", title: "" }]);
  }

  function removeTimelineItem(index: number) {
    setTimeline((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
        body: JSON.stringify({
          siteIdentity,
          contactInfo,
          socialLinks: socialLinks.map((item) => ({ label: item.label.trim(), url: item.url.trim() })).filter((item) => item.label && item.url),
          seoDefaults,
          footerSettings,
          homeHero,
          pastorGreeting: {
            pastorProfileId: form.pastorProfileId,
            eyebrow: form.eyebrow,
            title: form.title,
            body: form.body,
          },
          churchHistoryTimeline: timeline.map((item) => ({ year: item.year.trim(), title: item.title.trim() })).filter((item) => item.year && item.title),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal menyimpan settings");
      const settings = result.data as Settings;
      setSiteIdentity({ ...defaultSiteIdentity, ...settings.siteIdentity });
      setContactInfo({ ...defaultContactInfo, ...settings.contactInfo });
      setSocialLinks(settings.socialLinks ?? []);
      setSeoDefaults({ ...defaultSeoDefaults, ...settings.seoDefaults });
      setFooterSettings({ ...defaultFooterSettings, ...settings.footerSettings });
      setHomeHero({ ...defaultHomeHero, ...settings.homeHero });
      setForm({ ...emptyGreeting, ...settings.pastorGreeting });
      setTimeline(settings.churchHistoryTimeline?.length ? settings.churchHistoryTimeline : defaultTimeline);
      setNotice(result.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={save}>
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Identitas Website</h3>
            <p className="mt-1 text-sm text-slate-500">Nama gereja, nama sinode atau gereja induk, dan logo yang dipakai di header dan metadata website.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadSettings} disabled={hydrated && (loading || saving)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Muat
            </button>
            <button disabled={hydrated && (saving || loading)} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {notice ? <Alert tone="good" text={notice} /> : null}
          {error ? <Alert tone="bad" text={error} /> : null}
          <Field label="Nama Gereja / Website" value={siteIdentity.siteName} onChange={(value) => updateSiteIdentity("siteName", value)} required />
          <Field label="Nama Sinode / Gereja Induk" value={siteIdentity.denomination} onChange={(value) => updateSiteIdentity("denomination", value)} required />
          <Field label="Logo URL" value={siteIdentity.logoUrl} onChange={(value) => updateSiteIdentity("logoUrl", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <SectionHeader title="Kontak & Jam Kantor" description="Informasi ini dipakai di footer dan halaman kontak." />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Text label="Alamat" value={contactInfo.address} onChange={(value) => updateContactInfo("address", value)} rows={4} />
          </div>
          <Field label="Telepon" value={contactInfo.phone} onChange={(value) => updateContactInfo("phone", value)} />
          <Field label="WhatsApp" value={contactInfo.whatsapp} onChange={(value) => updateContactInfo("whatsapp", value)} />
          <Field label="Email" value={contactInfo.email} onChange={(value) => updateContactInfo("email", value)} />
          <Field label="Jam Kantor" value={contactInfo.officeHours} onChange={(value) => updateContactInfo("officeHours", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <SectionHeader title="SEO Default" description="Judul dan deskripsi default untuk halaman utama website." />
        <div className="grid gap-4 p-4">
          <Field label="SEO Title" value={seoDefaults.title} onChange={(value) => updateSeoDefaults("title", value)} required />
          <Text label="SEO Description" value={seoDefaults.description} onChange={(value) => updateSeoDefaults("description", value)} rows={4} />
          <Field label="OG Image URL" value={seoDefaults.ogImageUrl} onChange={(value) => updateSeoDefaults("ogImageUrl", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <SectionHeader title="Hero Beranda" description="Konten utama di bagian paling atas halaman Beranda." />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Eyebrow" value={homeHero.eyebrow} onChange={(value) => updateHomeHero("eyebrow", value)} required />
          <Field label="Judul" value={homeHero.title} onChange={(value) => updateHomeHero("title", value)} required />
          <div className="md:col-span-2">
            <Text label="Deskripsi" value={homeHero.description} onChange={(value) => updateHomeHero("description", value)} rows={4} />
          </div>
          <Field label="Primary Button Label" value={homeHero.primaryLabel} onChange={(value) => updateHomeHero("primaryLabel", value)} required />
          <Field label="Primary Button Link" value={homeHero.primaryHref} onChange={(value) => updateHomeHero("primaryHref", value)} required />
          <Field label="Secondary Button Label" value={homeHero.secondaryLabel} onChange={(value) => updateHomeHero("secondaryLabel", value)} required />
          <Field label="Secondary Button Link" value={homeHero.secondaryHref} onChange={(value) => updateHomeHero("secondaryHref", value)} required />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <SectionHeader title="Footer" description="Teks ringkas dan copyright di bagian bawah website." />
        <div className="grid gap-4 p-4">
          <Text label="Deskripsi Footer" value={footerSettings.description} onChange={(value) => updateFooterSettings("description", value)} rows={4} />
          <Field label="Copyright Text" value={footerSettings.copyrightText} onChange={(value) => updateFooterSettings("copyrightText", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Link Sosial Media</h3>
            <p className="mt-1 text-sm text-slate-500">Link ini akan tampil di footer jika diisi.</p>
          </div>
          <button type="button" onClick={addSocialLink} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold">
            <Plus size={16} />
            Tambah
          </button>
        </div>
        <div className="grid gap-3 p-4">
          {socialLinks.length ? socialLinks.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
              <Field label="Label" value={item.label} onChange={(value) => updateSocialLink(index, "label", value)} required />
              <Field label="URL" value={item.url} onChange={(value) => updateSocialLink(index, "url", value)} required />
              <button type="button" onClick={() => removeSocialLink(index)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 md:w-auto">
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          )) : <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">Belum ada link sosial media.</p>}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <SectionHeader title="Sambutan Pendeta" description="Konten ini tampil di bawah Hero halaman Beranda." />

        <div className="grid gap-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PastorSelect value={form.pastorProfileId} pastors={pastors} onChange={(value) => update("pastorProfileId", value)} />
            <Field label="Eyebrow" value={form.eyebrow} onChange={(value) => update("eyebrow", value)} required />
            <Field label="Judul" value={form.title} onChange={(value) => update("title", value)} required />
          </div>

          {selectedPastor ? (
            <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-200">
                {selectedPastor.photoUrl ? <img src={selectedPastor.photoUrl} alt={selectedPastor.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <p>
                  Data jabatan dan foto akan mengikuti profil pelayanan: <span className="font-semibold">{selectedPastor.role}</span>.
                </p>
                {selectedPastor.photoUrl ? <p className="mt-1 truncate text-xs text-slate-500">{selectedPastor.photoUrl}</p> : <p className="mt-1 text-xs text-amber-700">Profil ini belum memiliki foto.</p>}
              </div>
            </div>
          ) : null}

          <Text label="Isi Sambutan" value={form.body} maxLength={GREETING_BODY_MAX_LENGTH} onChange={(value) => update("body", value)} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Timeline Sejarah Gereja</h3>
            <p className="mt-1 text-sm text-slate-500">Konten ini tampil di bawah Sambutan Pendeta pada halaman Beranda.</p>
          </div>
          <button type="button" onClick={addTimelineItem} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold">
            <Plus size={16} />
            Tambah
          </button>
        </div>

        <div className="grid gap-3 p-4">
          {timeline.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[minmax(96px,120px)_minmax(0,1fr)_auto] md:items-end">
              <YearField value={item.year} onChange={(value) => updateTimeline(index, "year", value)} required />
              <Field label="Peristiwa" value={item.title} onChange={(value) => updateTimeline(index, "title", value)} required />
              <button type="button" disabled={timeline.length <= 1} onClick={() => removeTimelineItem(index)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-40 md:w-auto">
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function PastorSelect({ value, pastors, onChange }: { value: string; pastors: Profile[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      Nama Pendeta
      <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{pastors.length ? "Pilih pendeta" : "Belum ada profil Pendeta aktif"}</option>
        {pastors.map((pastor) => (
          <option key={pastor.id} value={pastor.id}>
            {pastor.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input required={required} className="h-10 min-w-0 rounded-md border border-slate-300 px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function YearField({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const normalizedValue = /^\d{4}$/.test(value) ? value : "";

  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
      Tahun
      <select required={required} className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm" value={normalizedValue} onChange={(event) => onChange(event.target.value)}>
        <option value="">Pilih</option>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}

function Text({ label, value, onChange, maxLength, rows = 7 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; rows?: number }) {
  const remaining = maxLength ? maxLength - value.length : null;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea required rows={rows} maxLength={maxLength} className="rounded-md border border-slate-300 px-3 py-2 text-sm leading-6" value={value} onChange={(event) => onChange(event.target.value)} />
      {remaining !== null ? <span className={`text-xs font-medium ${remaining < 60 ? "text-amber-700" : "text-slate-500"}`}>Sisa {remaining} karakter</span> : null}
    </label>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-slate-200 p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return <div className={`rounded-md border px-3 py-2 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>;
}
