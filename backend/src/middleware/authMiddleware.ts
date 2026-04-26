import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types/index.js";
import { AppError } from "./errorHandler.js";

/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer dans le header Authorization
 * Injecte req.user avec le payload décodé
 */
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Token d'authentification manquant.", 401, "MISSING_TOKEN"));
  }

  const token = authHeader.slice(7); // retire "Bearer "

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET non configuré");

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token expiré. Veuillez vous reconnecter.", 401, "TOKEN_EXPIRED"));
    }
    return next(new AppError("Token invalide.", 401, "INVALID_TOKEN"));
  }
}

/**
 * Middleware de vérification du rôle admin
 * Doit être utilisé APRÈS authenticate
 */
export function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError("Non authentifié.", 401, "UNAUTHENTICATED"));
  }
  if (req.user.role !== "admin") {
    return next(new AppError("Accès refusé. Droits administrateur requis.", 403, "FORBIDDEN"));
  }
  next();
}
