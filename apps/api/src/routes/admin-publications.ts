import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const categorySchema = z.enum(["BERITA_KEGIATAN", "ARTIKEL_RENUNGAN", "PUBLIKASI_RESMI"]);
const slugSchema = z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung");
const payloadSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1),
  category: categorySchema,
  excerpt: z.string().trim().min(1),
  content: z.array(z.string().trim().min(1)).default([]),
  author: z.string().trim().min(1),
  publishedAt: z.string().datetime().optional().nullable(),
  thumbnailUrl: z.string().trim().optional().nullable(),
  thumbnailTone: z.string().trim().optional().nullable(),
  readTime: z.string().trim().optional().nullable(),
  seoTitle: z.string().trim().optional().nullable(),
  seoDescription: z.string().trim().optional().nullable(),
  status: statusSchema.default("DRAFT"),
});
const optional = (value: string | null | undefined) => value?.trim() ? value.trim() : null;

export async function adminPublicationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/publications", async (request) => {
    const query = request.query as { search?: string; status?: string; category?: string; page?: string; limit?: string };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const where = {
      deletedAt: null,
      ...(query.status && query.status !== "ALL" ? { status: query.status as never } : {}),
      ...(query.category && query.category !== "ALL" ? { category: query.category as never } : {}),
      ...(query.search ? { OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { slug: { contains: query.search, mode: "insensitive" as const } },
        { excerpt: { contains: query.search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.publication.findMany({ where, orderBy: [{ updatedAt: "desc" }, { title: "asc" }], skip: (page - 1) * limit, take: limit }),
      prisma.publication.count({ where }),
    ]);
    return ok(items, { page, limit, total });
  });

  app.post("/api/admin/publications", async (request, reply) => {
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data publikasi belum valid", meta: parsed.error.flatten() });
    const payload = parsed.data;
    const existing = await prisma.publication.findUnique({ where: { slug: payload.slug } });
    if (existing && !existing.deletedAt) return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai publikasi lain" });
    const item = await prisma.publication.create({ data: {
      slug: payload.slug,
      title: payload.title,
      category: payload.category,
      excerpt: payload.excerpt,
      content: payload.content,
      author: payload.author,
      publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
      thumbnailUrl: optional(payload.thumbnailUrl),
      thumbnailTone: optional(payload.thumbnailTone),
      readTime: optional(payload.readTime),
      seoTitle: optional(payload.seoTitle),
      seoDescription: optional(payload.seoDescription),
      status: payload.status,
    } });
    return reply.code(201).send(ok(item, undefined, "Publikasi berhasil dibuat"));
  });

  app.get("/api/admin/publications/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.publication.findFirst({ where: { id, deletedAt: null } });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Publikasi tidak ditemukan" });
    return ok(item);
  });

  app.patch("/api/admin/publications/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data publikasi belum valid", meta: parsed.error.flatten() });
    const current = await prisma.publication.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Publikasi tidak ditemukan" });
    const duplicate = await prisma.publication.findUnique({ where: { slug: parsed.data.slug } });
    if (duplicate && duplicate.id !== id && !duplicate.deletedAt) return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai publikasi lain" });
    const payload = parsed.data;
    const item = await prisma.publication.update({ where: { id }, data: {
      slug: payload.slug,
      title: payload.title,
      category: payload.category,
      excerpt: payload.excerpt,
      content: payload.content,
      author: payload.author,
      publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
      thumbnailUrl: optional(payload.thumbnailUrl),
      thumbnailTone: optional(payload.thumbnailTone),
      readTime: optional(payload.readTime),
      seoTitle: optional(payload.seoTitle),
      seoDescription: optional(payload.seoDescription),
      status: payload.status,
    } });
    return ok(item, undefined, "Publikasi berhasil diperbarui");
  });

  app.delete("/api/admin/publications/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.publication.findFirst({ where: { id, deletedAt: null } });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Publikasi tidak ditemukan" });
    await prisma.publication.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
    return ok(null, undefined, "Publikasi berhasil dihapus");
  });
}
