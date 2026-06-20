import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const payloadSchema = z.object({
  description: z.string().trim().min(1),
  imageUrl: z.string().trim().min(1),
  status: statusSchema.default("DRAFT"),
});

function includeMedia() {
  return { media: true };
}

export async function adminGalleryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/gallery", async (request) => {
    const query = request.query as { search?: string; status?: string; page?: string; limit?: string };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const where = {
      deletedAt: null,
      ...(query.status && query.status !== "ALL" ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: "insensitive" as const } },
              { media: { url: { contains: query.search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: includeMedia(),
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.galleryItem.count({ where }),
    ]);
    return ok(items, { page, limit, total });
  });

  app.get("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.galleryItem.findFirst({ where: { id, deletedAt: null }, include: includeMedia() });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Item galeri tidak ditemukan" });
    return ok(item);
  });

  app.post("/api/admin/gallery", async (request, reply) => {
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Data galeri belum valid", meta: parsed.error.flatten() });
    }

    const payload = parsed.data;
    const item = await prisma.galleryItem.create({
      data: {
        description: payload.description,
        status: payload.status,
        media: { create: { url: payload.imageUrl } },
      },
      include: includeMedia(),
    });
    return reply.code(201).send(ok(item, undefined, "Item galeri berhasil dibuat"));
  });

  app.patch("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Data galeri belum valid", meta: parsed.error.flatten() });
    }

    const current = await prisma.galleryItem.findFirst({ where: { id, deletedAt: null }, include: includeMedia() });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Item galeri tidak ditemukan" });

    const payload = parsed.data;
    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        description: payload.description,
        status: payload.status,
        media: { update: { url: payload.imageUrl } },
      },
      include: includeMedia(),
    });
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
