import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin", description: "Akses penuh CMS HKBP" },
  });

  const user = await prisma.user.upsert({
    where: { email: "admin@hkbp.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@hkbp.local",
      passwordHash: await bcrypt.hash("admin12345", 12),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  await prisma.page.upsert({
    where: { slug: "tentang" },
    update: {},
    create: {
      slug: "tentang",
      title: "Tentang",
      eyebrow: "Profil Jemaat",
      description: "Ruang pengenalan jemaat, arah pelayanan, dan dokumentasi kehidupan bergereja.",
      summary: "HKBP Resort Srengseng Sawah hadir sebagai rumah rohani yang menumbuhkan iman, persekutuan, kesaksian, dan pelayanan kasih.",
      status: "PUBLISHED",
      highlights: { create: ["Sejarah pelayanan", "Visi dan misi", "Dokumentasi kegiatan"].map((text, sortOrder) => ({ text, sortOrder })) },
      sections: { create: [{ title: "Identitas Jemaat", body: "Gambaran umum gereja dan nilai pelayanan.", sortOrder: 0 }] },
    },
  });

  await prisma.publication.upsert({
    where: { slug: "pelayanan-kasih-di-lingkungan-jemaat" },
    update: {},
    create: {
      slug: "pelayanan-kasih-di-lingkungan-jemaat",
      title: "Pelayanan Kasih di Lingkungan Jemaat",
      category: "BERITA_KEGIATAN",
      excerpt: "Tim diakonia bersama parhalado melaksanakan kunjungan dan pembagian paket kasih.",
      content: ["Pelayanan kasih menjadi salah satu wujud nyata panggilan gereja."],
      author: "Tim Publikasi",
      readTime: "3 menit baca",
      publishedAt: new Date("2026-06-07T00:00:00.000Z"),
      status: "PUBLISHED",
    },
  });

  await prisma.warta.upsert({
    where: { slug: "warta-mingguan-21-juni-2026" },
    update: {},
    create: {
      slug: "warta-mingguan-21-juni-2026",
      title: "Warta Mingguan 21 Juni 2026",
      date: new Date("2026-06-21T00:00:00.000Z"),
      isCurrent: true,
      status: "PUBLISHED",
      pdfVersions: {
        create: [
          { language: "INDONESIA", label: "Bahasa Indonesia", fileUrl: "/warta/warta-mingguan-2026-06-21.pdf", fileName: "warta-mingguan-2026-06-21.pdf" },
          { language: "BATAK", label: "Bahasa Batak", fileUrl: "/warta/warta-mingguan-2026-06-21-batak.pdf", fileName: "warta-mingguan-2026-06-21-batak.pdf" },
        ],
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "site" },
    update: {},
    create: { key: "site", value: { name: "HKBP Resort Srengseng Sawah", address: "Srengseng Sawah, Jakarta Selatan" } },
  });
}

main().finally(async () => prisma.$disconnect());
