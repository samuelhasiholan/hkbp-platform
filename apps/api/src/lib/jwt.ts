import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  type: "access" | "refresh";
  iat: number;
  exp: number;
};

const base64Url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

const parseDurationSeconds = (value: string | undefined, fallbackSeconds: number) => {
  if (!value) return fallbackSeconds;
  const match = value.match(/^(\d+)([smhd])?$/);
  if (!match) return fallbackSeconds;
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multiplier = unit === "m" ? 60 : unit === "h" ? 3600 : unit === "d" ? 86400 : 1;
  return amount * multiplier;
};

const sign = (content: string, secret: string) =>
  createHmac("sha256", secret).update(content).digest("base64url");

export function createToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  options: { secret: string; expiresIn: string | undefined; fallbackSeconds: number },
) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDurationSeconds(options.expiresIn, options.fallbackSeconds);
  const tokenPayload: JwtPayload = { ...payload, iat: now, exp };
  const content = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(tokenPayload))}`;
  return `${content}.${sign(content, options.secret)}`;
}

export function verifyToken(token: string, secret: string, expectedType: JwtPayload["type"]) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Invalid token signature");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);

  if (decoded.type !== expectedType) throw new Error("Invalid token type");
  if (decoded.exp <= now) throw new Error("Token expired");

  return decoded;
}
