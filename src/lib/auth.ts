import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface JwtPayload {
  userId: number;
  email: string;
  role: "user" | "admin";
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET || JWT_SECRET === "your-secret-key") {
  console.warn("⚠️  JWT_SECRET not set in environment variables. Using default key (NOT SECURE FOR PRODUCTION)");
}

/**
 * Génère un JWT signé
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Vérifie et décode un JWT
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Récupère le token depuis les headers Authorization
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Sauvegarde le token dans un httpOnly cookie (sécurisé)
 */
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    path: "/",
  });
}

/**
 * Récupère le token depuis les cookies
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value || null;
}

/**
 * Supprime le token cookie
 */
export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

/**
 * Hash un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare un mot de passe avec son hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
