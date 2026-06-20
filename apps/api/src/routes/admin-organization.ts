import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const categoryPayload = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
});
const profilePayload = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  bio: z.string().trim().optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
  servicePeriod: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
const wijkPayload = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  coordinator: z.string().trim().optional().nullable(),
  contact: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
});
const optional = (value: string | null | undefined) => value?.trim() ? value.trim() : null;
function includeCategory() { return { category: true }; }

export async function adminOrganizationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/organization/categories", async () => {
    const items = await prisma.organizationCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return ok(items);
  });

  app.post("/api/admin/organization/categories", async (request, reply) => {
    const parsed = categoryPayload.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data kategori belum valid", meta: parsed.error.flatten() });
    const item = await prisma.organizationCategory.upsert({ where: { slug: parsed.data.slug }, update: { name: parsed.data.name, description: optional(parsed.data.description), sortOrder: parsed.data.sortOrder }, create: { slug: parsed.data.slug, name: parsed.data.name, description: optional(parsed.data.description), sortOrder: parsed.data.sortOrder } });
    return ok(item, undefined, "Kategori organisasi tersimpan");
  });

  app.get("/api/admin/organization/profiles", async (request) => {
    const query = request.query as { search?: string; categoryId?: string };
    const where = {
      deletedAt: null,
      ...(query.categoryId && query.categoryId !== "ALL" ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        { role: { contains: query.search, mode: "insensitive" as const } },
        { bio: { contains: query.search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const items = await prisma.personProfile.findMany({ where, include: includeCategory(), orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return ok(items);
  });

  app.post("/api/admin/organization/profiles", async (request, reply) => {
    const parsed = profilePayload.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data profil belum valid", meta: parsed.error.flatten() });
    const payload = parsed.data;
    const item = await prisma.personProfile.create({ data: { categoryId: optional(payload.categoryId), name: payload.name, role: payload.role, bio: optional(payload.bio), photoUrl: optional(payload.photoUrl), servicePeriod: optional(payload.servicePeriod), sortOrder: payload.sortOrder, isActive: payload.isActive }, include: includeCategory() });
    return reply.code(201).send(ok(item, undefined, "Profil organisasi berhasil dibuat"));
  });

  app.patch("/api/admin/organization/profiles/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = profilePayload.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data profil belum valid", meta: parsed.error.flatten() });
    const current = await prisma.personProfile.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Profil organisasi tidak ditemukan" });
    const payload = parsed.data;
    const item = await prisma.personProfile.update({ where: { id }, data: { categoryId: optional(payload.categoryId), name: payload.name, role: payload.role, bio: optional(payload.bio), photoUrl: optional(payload.photoUrl), servicePeriod: optional(payload.servicePeriod), sortOrder: payload.sortOrder, isActive: payload.isActive }, include: includeCategory() });
    return ok(item, undefined, "Profil organisasi berhasil diperbarui");
  });

  app.delete("/api/admin/organization/profiles/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const current = await prisma.personProfile.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Profil organisasi tidak ditemukan" });
    await prisma.personProfile.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return ok(null, undefined, "Profil organisasi berhasil dihapus");
  });

  app.get("/api/admin/organization/wijk", async () => {
    const items = await prisma.wijk.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return ok(items);
  });

  app.post("/api/admin/organization/wijk", async (request, reply) => {
    const parsed = wijkPayload.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data wijk belum valid", meta: parsed.error.flatten() });
    const payload = parsed.data;
    const item = await prisma.wijk.create({ data: { name: payload.name, description: payload.description, coordinator: optional(payload.coordinator), contact: optional(payload.contact), sortOrder: payload.sortOrder } });
    return reply.code(201).send(ok(item, undefined, "Wijk berhasil dibuat"));
  });

  app.patch("/api/admin/organization/wijk/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = wijkPayload.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, data: null, message: "Data wijk belum valid", meta: parsed.error.flatten() });
    const current = await prisma.wijk.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Wijk tidak ditemukan" });
    const payload = parsed.data;
    const item = await prisma.wijk.update({ where: { id }, data: { name: payload.name, description: payload.description, coordinator: optional(payload.coordinator), contact: optional(payload.contact), sortOrder: payload.sortOrder } });
    return ok(item, undefined, "Wijk berhasil diperbarui");
  });

  app.delete("/api/admin/organization/wijk/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const current = await prisma.wijk.findFirst({ where: { id, deletedAt: null } });
    if (!current) return reply.code(404).send({ success: false, data: null, message: "Wijk tidak ditemukan" });
    await prisma.wijk.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok(null, undefined, "Wijk berhasil dihapus");
  });
}
