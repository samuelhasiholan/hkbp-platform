import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const published = { status: "PUBLISHED" as const, deletedAt: null };

export async function publicRoutes(app: FastifyInstance) {
  app.get("/api/public/site-settings", async () => {
    const settings = await prisma.siteSetting.findMany();
    return ok(Object.fromEntries(settings.map((item) => [item.key, item.value])));
  });

  app.get("/api/public/pages/*", async (request, reply) => {
    const slug = (request.params as { "*": string })["*"];
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        highlights: { orderBy: { sortOrder: "asc" } },
        sections: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!page || page.status !== "PUBLISHED" || page.deletedAt) {
      return reply.code(404).send(ok(null, undefined, "Page not found"));
    }
    return ok(page);
  });

  app.get("/api/public/publications", async () => {
    const items = await prisma.publication.findMany({ where: published, orderBy: { publishedAt: "desc" } });
    return ok(items);
  });

  app.get("/api/public/publications/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const item = await prisma.publication.findUnique({ where: { slug } });
    if (!item || item.status !== "PUBLISHED" || item.deletedAt) {
      return reply.code(404).send(ok(null, undefined, "Publication not found"));
    }
    return ok(item);
  });

  app.get("/api/public/warta/current", async (request, reply) => {
    const item = await prisma.warta.findFirst({ where: { ...published, isCurrent: true }, include: { pdfVersions: true }, orderBy: { date: "desc" } });
    if (!item) return reply.code(404).send(ok(null, undefined, "Current warta not found"));
    return ok(item);
  });

  app.get("/api/public/warta/archive", async () => {
    const items = await prisma.warta.findMany({ where: { ...published, isCurrent: false }, include: { pdfVersions: true }, orderBy: { date: "desc" } });
    return ok(items);
  });

  app.get("/api/public/schedules", async () => {
    const items = await prisma.schedule.findMany({ where: published, orderBy: { startsAt: "asc" } });
    return ok(items);
  });
}
