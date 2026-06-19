import type { FastifyInstance } from "fastify";
import { ok } from "../lib/response.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ok({ status: "healthy" }));
}
