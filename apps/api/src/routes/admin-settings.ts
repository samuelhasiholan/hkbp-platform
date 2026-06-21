import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const PASTOR_GREETING_BODY_MAX_LENGTH = 600;

const pastorGreetingSchema = z.object({
  eyebrow: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1).max(PASTOR_GREETING_BODY_MAX_LENGTH),
  pastorProfileId: z.string().trim().optional().default(""),
});

const historyTimelineItemSchema = z.object({
  year: z.string().trim().min(1),
  title: z.string().trim().min(1),
});

const siteIdentitySchema = z.object({
  siteName: z.string().trim().min(1),
  denomination: z.string().trim().min(1),
  logoUrl: z.string().trim().optional().nullable(),
});

const contactInfoSchema = z.object({
  address: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().nullable(),
  officeHours: z.string().trim().optional().nullable(),
});

const socialLinkSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

const seoDefaultsSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  ogImageUrl: z.string().trim().optional().nullable(),
});

const footerSettingsSchema = z.object({
  description: z.string().trim().min(1),
  copyrightText: z.string().trim().optional().nullable(),
});

const homeHeroSchema = z.object({
  eyebrow: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  primaryLabel: z.string().trim().min(1),
  primaryHref: z.string().trim().min(1),
  secondaryLabel: z.string().trim().min(1),
  secondaryHref: z.string().trim().min(1),
});

const settingsPayloadSchema = z.object({
  siteIdentity: siteIdentitySchema,
  contactInfo: contactInfoSchema,
  socialLinks: z.array(socialLinkSchema).default([]),
  seoDefaults: seoDefaultsSchema,
  footerSettings: footerSettingsSchema,
  homeHero: homeHeroSchema,
  pastorGreeting: pastorGreetingSchema,
  churchHistoryTimeline: z.array(historyTimelineItemSchema).min(1),
});

const defaultSettings = {
  siteIdentity: {
    siteName: "HKBP Resort Srengseng Sawah",
    denomination: "Huria Kristen Batak Protestan",
    logoUrl: "",
  },
  contactInfo: {
    address: "Gg. Amalia Jl. Srengseng Sawah No.4, RT.3/RW.3, Srengseng Sawah, Kec. Jagakarsa, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12630",
    phone: "08xx-xxxx-xxxx",
    whatsapp: "",
    email: "admin@hkbp.or.id",
    officeHours: "Senin - Sabtu, 09.00 - 16.00 WIB",
  },
  socialLinks: [],
  seoDefaults: {
    title: "HKBP Resort Srengseng Sawah",
    description: "Website HKBP Resort Srengseng Sawah untuk informasi ibadah, organisasi, warta, berita, dan kontak gereja.",
    ogImageUrl: "",
  },
  footerSettings: {
    description: "Website jemaat untuk informasi ibadah, organisasi, warta, berita, dan pelayanan gereja.",
    copyrightText: "",
  },
  homeHero: {
    eyebrow: "Website Resmi",
    title: "HKBP Resort Srengseng Sawah",
    description: "Pusat informasi ibadah, pelayanan, organisasi, warta jemaat, berita, dan kontak gereja untuk mendukung kehidupan persekutuan.",
    primaryLabel: "Lihat Jadwal Ibadah",
    primaryHref: "/jadwal-pelayanan/ibadah-minggu",
    secondaryLabel: "Baca Warta Jemaat",
    secondaryHref: "/warta-jemaat/warta-mingguan",
  },
  pastorGreeting: {
    eyebrow: "Sambutan Pendeta",
    title: "Horas, selamat datang di HKBP Resort Srengseng Sawah",
    body: "Dengan penuh sukacita kami menyambut setiap jemaat dan pengunjung yang hadir melalui ruang digital ini. Kiranya informasi pelayanan, ibadah, dan persekutuan yang tersedia menolong kita semakin bertumbuh dalam iman, kasih, dan pengharapan di dalam Kristus.",
    pastorProfileId: "",
    pastorName: "Pdt. HKBP Resort Srengseng Sawah",
    pastorRole: "Pendeta Resort",
    photoUrl: "",
  },
  churchHistoryTimeline: [
    { year: "1966", title: "HKBP Srengseng Sawah didirikan" },
    { year: "2016", title: "Jubileum 50 tahun" },
    { year: "2017", title: "Peresmian gedung gereja baru" },
    { year: "2026", title: "Pembangunan gereja tahap 1" },
  ],
};

type PastorGreetingSetting = typeof defaultSettings.pastorGreeting & {
  pastorProfileId?: string;
};

async function hydratePastorGreeting(value: unknown) {
  const greeting = {
    ...defaultSettings.pastorGreeting,
    ...((value ?? {}) as Partial<PastorGreetingSetting>),
  };

  if (!greeting.pastorProfileId) {
    return greeting;
  }

  const pastor = await prisma.personProfile.findFirst({
    where: {
      id: greeting.pastorProfileId,
      deletedAt: null,
      isActive: true,
    },
  });

  if (!pastor) {
    return greeting;
  }

  return {
    ...greeting,
    pastorName: pastor.name,
    pastorRole: pastor.role,
    photoUrl: pastor.photoUrl ?? "",
  };
}

async function readSettings() {
  const settingKeys = Object.keys(defaultSettings);
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: settingKeys } },
  });
  const values = Object.fromEntries(settings.map((item) => [item.key, item.value]));

  return {
    ...defaultSettings,
    ...values,
    pastorGreeting: await hydratePastorGreeting(values.pastorGreeting),
    churchHistoryTimeline: values.churchHistoryTimeline ?? defaultSettings.churchHistoryTimeline,
  };
}

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/settings", async () => {
    return ok(await readSettings());
  });

  app.patch("/api/admin/settings", async (request, reply) => {
    const parsed = settingsPayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Data settings belum valid",
        meta: parsed.error.flatten(),
      });
    }

    const pastor = parsed.data.pastorGreeting.pastorProfileId
      ? await prisma.personProfile.findFirst({
          where: {
            id: parsed.data.pastorGreeting.pastorProfileId,
            deletedAt: null,
            isActive: true,
            category: {
              OR: [
                { slug: "pendeta" },
                { name: { equals: "Pendeta", mode: "insensitive" } },
              ],
            },
          },
          include: { category: true },
        })
      : null;
    if (parsed.data.pastorGreeting.pastorProfileId && !pastor) {
      return reply.code(400).send({ success: false, data: null, message: "Pendeta aktif tidak ditemukan" });
    }

    const pastorGreeting = pastor
      ? {
          ...parsed.data.pastorGreeting,
          pastorName: pastor.name,
          pastorRole: pastor.role,
          photoUrl: pastor.photoUrl ?? "",
        }
      : {
          ...defaultSettings.pastorGreeting,
          ...parsed.data.pastorGreeting,
        };

    const settingsToSave = {
      siteIdentity: parsed.data.siteIdentity,
      contactInfo: parsed.data.contactInfo,
      socialLinks: parsed.data.socialLinks,
      seoDefaults: parsed.data.seoDefaults,
      footerSettings: parsed.data.footerSettings,
      homeHero: parsed.data.homeHero,
      pastorGreeting,
      churchHistoryTimeline: parsed.data.churchHistoryTimeline,
    };

    await Promise.all(
      Object.entries(settingsToSave).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );

    return ok(await readSettings(), undefined, "Settings berhasil disimpan");
  });
}
