import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastify from "fastify";
import { adminGalleryRoutes } from "./routes/admin-gallery.js";
import { adminOrganizationRoutes } from "./routes/admin-organization.js";
import { adminPublicationRoutes } from "./routes/admin-publications.js";
import { adminSettingsRoutes } from "./routes/admin-settings.js";
import { adminWartaRoutes } from "./routes/admin-warta.js";
import { adminPageRoutes } from "./routes/admin-pages.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { publicRoutes } from "./routes/public.js";

const app = fastify({ logger: true, maxParamLength: 500 });
const port = Number(process.env.API_PORT ?? 4000);

await app.register(cors, { origin: true, credentials: true });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(adminPageRoutes);
await app.register(adminOrganizationRoutes);
await app.register(adminGalleryRoutes);
await app.register(adminWartaRoutes);
await app.register(adminPublicationRoutes);
await app.register(adminSettingsRoutes);
await app.register(publicRoutes);

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  reply
    .code(500)
    .send({ success: false, data: null, message: "Internal server error" });
});

await app.listen({ port, host: "0.0.0.0" });
