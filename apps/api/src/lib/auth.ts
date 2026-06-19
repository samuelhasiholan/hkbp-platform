import type { FastifyRequest } from "fastify";
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

export async function requireAuth(request: FastifyRequest) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) throw new Error("Missing bearer token");

  (request as AuthenticatedRequest).user = verifyToken(token, getAccessSecret(), "access");
}
