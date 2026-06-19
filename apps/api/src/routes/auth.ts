import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAccessSecret, getRefreshSecret, requireAuth, type AuthenticatedRequest } from "../lib/auth.js";
import { createToken, verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/response.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  roles: { role: { name: string } }[];
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((item) => item.role.name),
  };
}

function issueTokens(user: ReturnType<typeof publicUser>) {
  const payload = { sub: user.id, email: user.email, roles: user.roles };
  return {
    accessToken: createToken(
      { ...payload, type: "access" },
      { secret: getAccessSecret(), expiresIn: process.env.JWT_ACCESS_EXPIRES_IN, fallbackSeconds: 15 * 60 },
    ),
    refreshToken: createToken(
      { ...payload, type: "refresh" },
      { secret: getRefreshSecret(), expiresIn: process.env.JWT_REFRESH_EXPIRES_IN, fallbackSeconds: 7 * 86400 },
    ),
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Email dan password wajib diisi dengan benar" });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return reply.code(401).send({ success: false, data: null, message: "Email atau password salah" });
    }

    const passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordValid) {
      return reply.code(401).send({ success: false, data: null, message: "Email atau password salah" });
    }

    const safeUser = publicUser(user);
    return ok({ user: safeUser, ...issueTokens(safeUser) }, undefined, "Login berhasil");
  });

  app.post("/api/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, data: null, message: "Refresh token wajib diisi" });
    }

    try {
      const payload = verifyToken(parsed.data.refreshToken, getRefreshSecret(), "refresh");
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: { include: { role: true } } },
      });

      if (!user || !user.isActive || user.deletedAt) {
        return reply.code(401).send({ success: false, data: null, message: "User tidak aktif" });
      }

      const safeUser = publicUser(user);
      return ok({ user: safeUser, ...issueTokens(safeUser) }, undefined, "Token diperbarui");
    } catch {
      return reply.code(401).send({ success: false, data: null, message: "Refresh token tidak valid" });
    }
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request) => {
    const authRequest = request as AuthenticatedRequest;
    const user = await prisma.user.findUnique({
      where: { id: authRequest.user.sub },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return { success: false, data: null, message: "User tidak aktif" };
    }

    return ok(publicUser(user));
  });

  app.post("/api/auth/logout", async () => ok(null, undefined, "Logout berhasil"));
}
