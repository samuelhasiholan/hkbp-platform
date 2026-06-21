import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const pdfSchema = z.object({
  language: z.enum(["INDONESIA", "BATAK"]),
  label: z.string().trim().min(1),
  fileUrl: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
});
const payloadSchema = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  date: z.string().min(1),
  isCurrent: z.boolean().default(false),
  status: statusSchema.default("DRAFT"),
  pdfVersions: z.array(pdfSchema).default([]),
});

function includePdf() { return { pdfVersions: { orderBy: { language: "asc" as const } } }; }

export async function adminWartaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/warta", async (request) => {
    const query = request.query as { search?: string; status?: string; page?: string; limit?: string };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const where = {
      deletedAt: null,
      ...(query.status && query.status !== "ALL" ? { status: query.status as never } : {}),
      ...(query.search ? { OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { slug: { contains: query.search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.warta.findMany({ where, include: includePdf(), orderBy: [{ date: "desc" }, { updatedAt: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.warta.count({ where }),
    ]);
    return ok(items, { page, limit, total });
  });

  app.post("/api/admin/warta", async (request, reply) => {
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data warta belum valid", meta: parsed.error.flatten() });
    const payload = parsed.data;
    const existing = await prisma.warta.findUnique({ where: { slug: payload.slug } });
    if (existing && !existing.deletedAt) return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai warta lain" });
    const item = await prisma.$transaction(async (tx) => {
      if (payload.isCurrent) await tx.warta.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      return tx.warta.create({ data: {
        slug: payload.slug,
        title: payload.title,
        date: new Date(payload.date),
        isCurrent: payload.isCurrent,
        status: payload.status,
        pdfVersions: { create: payload.pdfVersions },
      }, include: includePdf() });
    });
    return reply.code(201).send(ok(item, undefined, "Warta berhasil dibuat"));
  });

  app.get("/api/admin/warta/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.warta.findFirst({ where: { id, deletedAt: null }, include: includePdf() });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Warta tidak ditemukan" });
    return ok(item);
  });

  app.patch("/api/admin/warta/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = payloadSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data warta belum valid", meta: parsed.error.flatten() });
    const current = await prisma.warta.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Warta tidak ditemukan" });
    const duplicate = await prisma.warta.findUnique({ where: { slug: parsed.data.slug } });
    if (duplicate && duplicate.id !== id && !duplicate.deletedAt) return reply.code(409).send({ success: false, data: null, message: "Slug sudah dipakai warta lain" });
    const payload = parsed.data;
    const item = await prisma.$transaction(async (tx) => {
      if (payload.isCurrent) await tx.warta.updateMany({ where: { isCurrent: true, NOT: { id } }, data: { isCurrent: false } });
      await tx.wartaPdf.deleteMany({ where: { wartaId: id } });
      return tx.warta.update({ where: { id }, data: {
        slug: payload.slug,
        title: payload.title,
        date: new Date(payload.date),
        isCurrent: payload.isCurrent,
        status: payload.status,
        pdfVersions: { create: payload.pdfVersions },
      }, include: includePdf() });
    });
    return ok(item, undefined, "Warta berhasil diperbarui");
  });

  app.delete("/api/admin/warta/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.warta.findFirst({ where: { id, deletedAt: null } });
    if (!item) return reply.code(404).send({ success: false, data: null, message: "Warta tidak ditemukan" });
    await prisma.warta.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", isCurrent: false } });
    return ok(null, undefined, "Warta berhasil dihapus");
  });
}
