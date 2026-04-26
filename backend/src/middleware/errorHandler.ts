import { Request, Response, NextFunction } from "express";

/** Erreur applicative avec code HTTP */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion centralisée des erreurs
 * Doit être enregistré EN DERNIER dans Express (après toutes les routes)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erreur applicative connue
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Erreur MySQL : doublon (email/phone déjà utilisé)
  if ((err as NodeJS.ErrnoException).code === "ER_DUP_ENTRY") {
    res.status(409).json({
      success: false,
      message: "Cette adresse e-mail ou ce numéro de téléphone est déjà utilisé.",
      code: "DUPLICATE_ENTRY",
    });
    return;
  }

  // Erreur inattendue — ne pas exposer les détails en production
  console.error("Erreur non gérée :", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Une erreur interne est survenue."
        : err.message,
    code: "INTERNAL_ERROR",
  });
}
