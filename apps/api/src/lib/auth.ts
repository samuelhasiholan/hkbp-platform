import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken, type JwtPayload } from "./jwt.js";

export type AuthenticatedRequest = FastifyRequest & {
  user: JwtPayload;
};

export function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return secret;
}

export function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return secret;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return reply.code(401).send({ success: false, data: null, message: "Unauthorized" });
  }

  try {
    (request as AuthenticatedRequest).user = verifyToken(token, getAccessSecret(), "access");
  } catch {
    return reply.code(401).send({ success: false, data: null, message: "Unauthorized" });
  }
}
