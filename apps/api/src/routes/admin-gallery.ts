import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const payloadSchema = z.object({
  title: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().min(1),
  fileName: z.string().trim().optional().nullable(),
  mimeType: z.string().trim().optional().nullable(),
  altText: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  status: statusSchema.default("DRAFT"),
});
const optional = (value: string | null | undefined) => value?.trim() ? value.trim() : null;
function includeMedia() { return { media: true }; }

export async function adminGalleryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/gallery", async (request) => {
    const query = request.query as { search?: string; status?: string; page?: string; limit?: string };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const where = {
      deletedAt: null,
      ...(query.status && query.status !== "ALL" ? { status: query.status as never } : {}),
      ...(query.search ? { OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { description: { contains: query.search, mode: "insensitive" as const } },
        { category: { contains: query.search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({ where, include: includeMedia(), orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.galleryItem.count({ where }),
    ]);
    return ok(items, { page, limit, total });
  });

  app.post("/api/admin/gallery", async (request, reply) => {
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data galeri belum valid", meta: parsed.error.flatten() });
    const payload = parsed.data;
    const item = await prisma.galleryItem.create({ data: {
      title: optional(payload.title),
      description: optional(payload.description),
      category: optional(payload.category),
      eventDate: payload.eventDate ? new Date(payload.eventDate) : null,
      sortOrder: payload.sortOrder,
      status: payload.status,
      media: { create: {
        type: "IMAGE",
        url: payload.imageUrl,
        fileName: optional(payload.fileName) ?? payload.imageUrl.split("/").pop() ?? "image",
        mimeType: optional(payload.mimeType) ?? "image/*",
        sizeBytes: 0,
        altText: optional(payload.altText),
        description: optional(payload.description),
      } },
    }, include: includeMedia() });
    return reply.code(201).send(ok(item, undefined, "Item galeri berhasil dibuat"));
  });

  app.patch("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data galeri belum valid", meta: parsed.error.flatten() });
    const current = await prisma.galleryItem.findFirst({ where: { id, deletedAt: null }, include: includeMedia() });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Item galeri tidak ditemukan" });
    const payload = parsed.data;
    const item = await prisma.galleryItem.update({ where: { id }, data: {
      title: optional(payload.title),
      description: optional(payload.description),
      category: optional(payload.category),
      eventDate: payload.eventDate ? new Date(payload.eventDate) : null,
      sortOrder: payload.sortOrder,
      status: payload.status,
      media: { update: {
        url: payload.imageUrl,
        fileName: optional(payload.fileName) ?? payload.imageUrl.split("/").pop() ?? "image",
        mimeType: optional(payload.mimeType) ?? "image/*",
        altText: optional(payload.altText),
        description: optional(payload.description),
      } },
    }, include: includeMedia() });
    return ok(item, undefined, "Item galeri berhasil diperbarui");
  });

  app.delete("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.galleryItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Item galeri tidak ditemukan" });
    await prisma.galleryItem.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
    return ok(null, undefined, "Item galeri berhasil dihapus");
  });
}
