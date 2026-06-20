import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const sectionSchema = z.object({
  title: z.string().trim().min(1, "Judul section wajib diisi"),
  body: z.string().trim().min(1, "Isi section wajib diisi"),
});

const pagePayloadSchema = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, "Slug hanya boleh huruf kecil, angka, tanda hubung, dan slash"),
  title: z.string().trim().min(1),
  eyebrow: z.string().trim().optional().nullable(),
  description: z.string().trim().min(1),
  summary: z.string().trim().optional().nullable(),
  callout: z.string().trim().optional().nullable(),
  layoutVariant: z.string().trim().optional().nullable(),
  seoTitle: z.string().trim().optional().nullable(),
  seoDescription: z.string().trim().optional().nullable(),
  status: contentStatusSchema.default("DRAFT"),
  highlights: z.array(z.string().trim().min(1)).default([]),
  sections: z.array(sectionSchema).default([]),
});

function pageInclude() {
  return {
    highlights: { orderBy: { sortOrder: "asc" as const } },
    sections: { orderBy: { sortOrder: "asc" as const } },
  };
}

function normalizeOptional(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

export async function adminPageRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/pages", async (request) => {
    const query = request.query as { search?: string; status?: string; page?: string; limit?: string };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.status && query.status !== "ALL" ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" as const } },
              { slug: { contains: query.search, mode: "insensitive" as const } },
              { description: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.page.findMany({
        where,
        include: pageInclude(),
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        skip,
        take: limit,
      }),
      prisma.page.count({ where }),
    ]);

    return ok(items, { page, limit, total });
  });

  app.post("/api/admin/pages", async (request, reply) => {
    const parsed = pagePayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Data halaman belum valid", meta: parsed.error.flatten() });
    }

    const payload = parsed.data;
    const existing = await prisma.page.findUnique({ where: { slug: payload.slug } });
    if (existing && !existing.deletedAt) {
      return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai halaman lain" });
    }

    const page = await prisma.page.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        eyebrow: normalizeOptional(payload.eyebrow),
        description: payload.description,
        summary: normalizeOptional(payload.summary),
        callout: normalizeOptional(payload.callout),
        layoutVariant: normalizeOptional(payload.layoutVariant),
        seoTitle: normalizeOptional(payload.seoTitle),
        seoDescription: normalizeOptional(payload.seoDescription),
        status: payload.status,
        highlights: { create: payload.highlights.map((text, sortOrder) => ({ text, sortOrder })) },
        sections: { create: payload.sections.map((section, sortOrder) => ({ ...section, sortOrder })) },
      },
      include: pageInclude(),
    });

    return reply.code(201).send(ok(page, undefined, "Halaman berhasil dibuat"));
  });

  app.get("/api/admin/pages/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null }, include: pageInclude() });
    if (!page) return reply.code(404).send({ success: false, data: null, message: "Halaman tidak ditemukan" });
    return ok(page);
  });

  app.patch("/api/admin/pages/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = pagePayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Data halaman belum valid", meta: parsed.error.flatten() });
    }

    const current = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Halaman tidak ditemukan" });

    const duplicate = await prisma.page.findUnique({ where: { slug: parsed.data.slug } });
    if (duplicate && duplicate.id !== id && !duplicate.deletedAt) {
      return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai halaman lain" });
    }

    const payload = parsed.data;
    const page = await prisma.$transaction(async (tx) => {
      await tx.pageHighlight.deleteMany({ where: { pageId: id } });
      await tx.pageSection.deleteMany({ where: { pageId: id } });
      return tx.page.update({
        where: { id },
        data: {
          slug: payload.slug,
          title: payload.title,
          eyebrow: normalizeOptional(payload.eyebrow),
          description: payload.description,
          summary: normalizeOptional(payload.summary),
          callout: normalizeOptional(payload.callout),
          layoutVariant: normalizeOptional(payload.layoutVariant),
          seoTitle: normalizeOptional(payload.seoTitle),
          seoDescription: normalizeOptional(payload.seoDescription),
          status: payload.status,
          highlights: { create: payload.highlights.map((text, sortOrder) => ({ text, sortOrder })) },
          sections: { create: payload.sections.map((section, sortOrder) => ({ ...section, sortOrder })) },
        },
        include: pageInclude(),
      });
    });

    return ok(page, undefined, "Halaman berhasil diperbarui");
  });

  app.delete("/api/admin/pages/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const page = await prisma.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) return reply.code(404).send({ success: false, data: null, message: "Halaman tidak ditemukan" });

    await prisma.page.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
    return ok(null, undefined, "Halaman berhasil dihapus");
  });
}
