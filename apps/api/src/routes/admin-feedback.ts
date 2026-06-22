import type { FastifyInstance } from "fastify";
import { requireAuth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const categories = ["IBADAH", "PELAYANAN", "SARANA_PRASARANA", "LAINNYA"];

export async function adminFeedbackRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/api/admin/feedback", async (request) => {
    const query = request.query as {
      search?: string;
      category?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const category =
      query.category && categories.includes(query.category)
        ? query.category
        : undefined;
    const search = query.search?.trim();
    const where = {
      ...(category ? { category: category as never } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { contactInfo: { contains: search, mode: "insensitive" as const } },
              { message: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.feedbackSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedbackSubmission.count({ where }),
    ]);

    return ok(items, { page, limit, total });
  });

  app.delete("/api/admin/feedback/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.feedbackSubmission.findUnique({ where: { id } });
    if (!item) {
      return reply
        .code(404)
        .send({ success: false, data: null, message: "Kritik dan saran tidak ditemukan" });
    }

    await prisma.feedbackSubmission.delete({ where: { id } });
    return ok(null, undefined, "Kritik dan saran berhasil dihapus");
  });
}
