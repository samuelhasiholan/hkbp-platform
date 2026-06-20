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
  pastorProfileId: z.string().trim().min(1),
});

const settingsPayloadSchema = z.object({
  pastorGreeting: pastorGreetingSchema,
});

const defaultSettings = {
  pastorGreeting: {
    eyebrow: "Sambutan Pendeta",
    title: "Horas, selamat datang di HKBP Resort Srengseng Sawah",
    body: "Dengan penuh sukacita kami menyambut setiap jemaat dan pengunjung yang hadir melalui ruang digital ini. Kiranya informasi pelayanan, ibadah, dan persekutuan yang tersedia menolong kita semakin bertumbuh dalam iman, kasih, dan pengharapan di dalam Kristus.",
    pastorProfileId: "",
    pastorName: "Pdt. HKBP Resort Srengseng Sawah",
    pastorRole: "Pendeta Resort",
    photoUrl: "",
  },
};

async function readSettings() {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ["pastorGreeting"] } },
  });
  return {
    ...defaultSettings,
    ...Object.fromEntries(settings.map((item) => [item.key, item.value])),
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

    const pastor = await prisma.personProfile.findFirst({
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
    });
    if (!pastor) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Pendeta aktif tidak ditemukan",
      });
    }

    const pastorGreeting = {
      ...parsed.data.pastorGreeting,
      pastorName: pastor.name,
      pastorRole: pastor.role,
      photoUrl: pastor.photoUrl ?? "",
    };

    await prisma.siteSetting.upsert({
      where: { key: "pastorGreeting" },
      update: { value: pastorGreeting },
      create: { key: "pastorGreeting", value: pastorGreeting },
    });

    return ok(await readSettings(), undefined, "Settings berhasil disimpan");
  });
}
