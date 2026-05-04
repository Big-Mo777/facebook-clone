import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "./auth";
import { ApiError } from "./errors";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number;
    email: string;
    role: "user" | "admin";
  };
}

/**
 * Middleware pour vérifier l'authentification JWT
 * Ajoute req.user si le token est valide
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    try {
      const authHeader = req.headers.get("authorization");
      const token = getTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: "Token manquant",
            code: "MISSING_TOKEN",
          },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          {
            success: false,
            message: "Token invalide ou expiré",
            code: "INVALID_TOKEN",
          },
          { status: 401 }
        );
      }

      req.user = payload;
      return handler(req);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Erreur serveur",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export function withAdminAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Accès réservé aux administrateurs",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Récupère l'IP client (compatible Vercel)
 */
export function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

/**
 * Récupère le User-Agent
 */
export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get("user-agent");
}
