import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

export type AuthUser = {
  id: number;
  email: string;
  role: "student" | "admin";
  name: string;
};

const secret = () =>
  process.env.JWT_SECRET_KEY || process.env.SESSION_SECRET || "studymate-development-secret";

const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expected] = encoded.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function createToken(user: AuthUser): string {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ ...user, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  const body = `${header}.${payload}`;
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readToken(token: string): AuthUser | null {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const expected = createHmac("sha256", secret()).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expected) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthUser & { exp?: number };
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getAuthUser(req: Request): AuthUser | null {
  const value = req.header("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  return readToken(value.slice("Bearer ".length));
}

export function requireUser(req: Request, role?: AuthUser["role"]): AuthUser | null {
  const user = getAuthUser(req);
  if (!user || (role && user.role !== role)) return null;
  return user;
}