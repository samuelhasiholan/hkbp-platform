import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient, type PublicationCategory } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const prisma = new PrismaClient();

const monthMap: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};
const categoryMap: Record<string, PublicationCategory> = {
  "Berita Kegiatan": "BERITA_KEGIATAN",
  "Artikel dan Renungan": "ARTIKEL_RENUNGAN",
  "Publikasi Resmi": "PUBLIKASI_RESMI",
};

type PublicationItem = { slug: string; title: string; category: string; excerpt: string; date: string; author: string; readTime: string; thumbnailTone: string; content: string[] };
type WartaItem = { slug: string; title: string; date: string; pdfVersions: { language: "indonesia" | "batak"; label: string; fileUrl: string; fileName: string }[] };
type PageContent = {
  title: string;
  galleryImages?: { src: string; alt: string; description: string }[];
  organizationProfiles?: { id: string; name: string; role: string; bio?: string; photo?: { src: string } }[];
  councilSections?: { id: string; title: string; description: string; profiles: { id: string; name: string; role: string; bio?: string; photo?: { src: string } }[] }[];
  retiredElderProfiles?: { id: string; name: string; role: string; servicePeriod: string; bio: string; photo?: { src: string } }[];
  wijkItems?: { name: string; description: string }[];
};

function parseIndonesianDate(value: string) {
  const match = value.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match) return new Date();
  return new Date(Date.UTC(Number(match[3]), monthMap[match[2]] ?? 0, Number(match[1])));
}
function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
async function importFrontend(relativePath: string) {
  const contentPath = path.resolve(process.cwd(), `../../../hkbp-frontend/${relativePath}`);
  return import(pathToFileURL(contentPath).href);
}
async function upsertCategory(slug: string, name: string, description?: string, sortOrder = 0) {
  return prisma.organizationCategory.upsert({
    where: { slug },
    update: { name, description: description ?? null, sortOrder },
    create: { slug, name, description: description ?? null, sortOrder },
  });
}

async function seedPublications() {
  const module = (await importFrontend("app/_data/publication-content.ts")) as { publications: PublicationItem[] };
  for (const item of module.publications) {
    await prisma.publication.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        category: categoryMap[item.category] ?? "BERITA_KEGIATAN",
        excerpt: item.excerpt,
        content: item.content,
        author: item.author,
        readTime: item.readTime,
        thumbnailTone: item.thumbnailTone,
        publishedAt: parseIndonesianDate(item.date),
        status: "PUBLISHED",
        deletedAt: null,
      },
      create: {
        slug: item.slug,
        title: item.title,
        category: categoryMap[item.category] ?? "BERITA_KEGIATAN",
        excerpt: item.excerpt,
        content: item.content,
        author: item.author,
        readTime: item.readTime,
        thumbnailTone: item.thumbnailTone,
        publishedAt: parseIndonesianDate(item.date),
        status: "PUBLISHED",
      },
    });
  }
}

async function seedWarta() {
  const module = (await importFrontend("app/_data/warta-content.ts")) as { weeklyWarta: WartaItem; archivedWarta: WartaItem[] };
  await prisma.warta.updateMany({ data: { isCurrent: false } });
  for (const item of [module.weeklyWarta, ...module.archivedWarta]) {
    const isCurrent = item.slug === module.weeklyWarta.slug;
    await prisma.warta.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        date: parseIndonesianDate(item.date),
        isCurrent,
        status: "PUBLISHED",
        deletedAt: null,
        pdfVersions: {
          deleteMany: {},
          create: item.pdfVersions.map((pdf) => ({ language: pdf.language === "indonesia" ? "INDONESIA" : "BATAK", label: pdf.label, fileUrl: pdf.fileUrl, fileName: pdf.fileName })),
        },
      },
      create: {
        slug: item.slug,
        title: item.title,
        date: parseIndonesianDate(item.date),
        isCurrent,
        status: "PUBLISHED",
        pdfVersions: { create: item.pdfVersions.map((pdf) => ({ language: pdf.language === "indonesia" ? "INDONESIA" : "BATAK", label: pdf.label, fileUrl: pdf.fileUrl, fileName: pdf.fileName })) },
      },
    });
  }
}

async function seedSiteContent() {
  const module = (await importFrontend("app/_data/site-content.ts")) as { pageContent: Record<string, PageContent> };
  const gallery = module.pageContent["tentang/galeri"]?.galleryImages ?? [];
  for (const image of gallery) {
    const existing = await prisma.galleryItem.findFirst({ where: { media: { url: image.src }, deletedAt: null } });
    if (existing) continue;
    await prisma.galleryItem.create({
      data: {
        description: image.description,
        status: "PUBLISHED",
        media: { create: { url: image.src } },
      },
    });
  }

  let categoryOrder = 0;
  let profileOrder = 0;
  for (const [pageSlug, content] of Object.entries(module.pageContent)) {
    if (content.organizationProfiles?.length) {
      const categorySlug = pageSlug.split("/").pop() ?? slugify(content.title);
      const category = await upsertCategory(categorySlug, content.title, undefined, categoryOrder++);
      for (const profile of content.organizationProfiles) {
        await prisma.personProfile.upsert({
          where: { id: profile.id },
          update: { categoryId: category.id, name: profile.name, role: profile.role, bio: profile.bio ?? null, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true, deletedAt: null },
          create: { id: profile.id, categoryId: category.id, name: profile.name, role: profile.role, bio: profile.bio ?? null, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true },
        });
      }
    }
    for (const section of content.councilSections ?? []) {
      const category = await upsertCategory(section.id, section.title, section.description, categoryOrder++);
      for (const profile of section.profiles) {
        await prisma.personProfile.upsert({
          where: { id: profile.id },
          update: { categoryId: category.id, name: profile.name, role: profile.role, bio: profile.bio ?? null, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true, deletedAt: null },
          create: { id: profile.id, categoryId: category.id, name: profile.name, role: profile.role, bio: profile.bio ?? null, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true },
        });
      }
    }
    if (content.retiredElderProfiles?.length) {
      const category = await upsertCategory("sintua-purnabakti", "Sintua Purnabakti", undefined, categoryOrder++);
      for (const profile of content.retiredElderProfiles) {
        await prisma.personProfile.upsert({
          where: { id: profile.id },
          update: { categoryId: category.id, name: profile.name, role: profile.role, servicePeriod: profile.servicePeriod, bio: profile.bio, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true, deletedAt: null },
          create: { id: profile.id, categoryId: category.id, name: profile.name, role: profile.role, servicePeriod: profile.servicePeriod, bio: profile.bio, photoUrl: profile.photo?.src ?? null, sortOrder: profileOrder++, isActive: true },
        });
      }
    }
    for (const [index, wijk] of (content.wijkItems ?? []).entries()) {
      const existing = await prisma.wijk.findFirst({ where: { name: wijk.name, deletedAt: null } });
      if (existing) await prisma.wijk.update({ where: { id: existing.id }, data: { description: wijk.description, sortOrder: index } });
      else await prisma.wijk.create({ data: { name: wijk.name, description: wijk.description, sortOrder: index } });
    }
  }
}

async function main() {
  await seedPublications();
  await seedWarta();
  await seedSiteContent();
  console.log("Seeded CMS content from hkbp-frontend.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
