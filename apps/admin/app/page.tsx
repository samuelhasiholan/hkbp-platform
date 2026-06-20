import { redirect } from "next/navigation";
import { AdminShell } from "./_components/admin-shell";
import { getCurrentUser } from "./_lib/auth";

const stats = [
  { label: "Berita", value: "1" },
  { label: "Warta Aktif", value: "1" },
  { label: "Halaman", value: "1" },
  { label: "Draft", value: "0" },
];

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AdminShell eyebrow="Dashboard" title="Ringkasan Konten Gereja" user={user}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold">Prioritas Berikutnya</h3>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p>Pages CMS sudah menjadi pola dasar untuk modul admin berikutnya.</p>
          <p>Setelah ini, pola yang sama bisa dipakai untuk Warta dan Publications.</p>
          <p>Upload PDF dan gambar akan ditambahkan saat modul Warta/Gallery dibuat.</p>
        </div>
      </section>
    </AdminShell>
  );
}
