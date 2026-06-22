import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50 px-4 py-10 text-slate-950 lg:grid-cols-[1fr_0.85fr] lg:px-0 lg:py-0">
      <section className="hidden border-r border-slate-200 bg-white px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">HKBP CMS</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-normal">Kelola konten pelayanan dari satu dashboard.</h1>
        </div>
        <div className="grid max-w-lg gap-3 text-sm leading-6 text-slate-600">
          <p>Login admin digunakan untuk mengelola warta, berita, halaman profil, galeri, jadwal pelayanan, dan struktur pelayanan.</p>
          <p>Gunakan akun seed awal untuk masuk pertama kali, lalu ganti kredensial saat modul user management sudah aktif.</p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md items-center lg:max-w-none lg:px-16">
        <div className="w-full rounded-md border border-slate-200 bg-white p-6 shadow-sm lg:max-w-md">
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">Masuk Admin</p>
          <h2 className="mt-3 text-2xl font-bold tracking-normal">HKBP Resort Srengseng Sawah</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Gunakan akun admin yang dibuat dari seed database.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
