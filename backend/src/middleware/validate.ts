import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware de validation express-validator
 * À placer après les règles de validation dans les routes
 * Retourne une 422 avec le détail des erreurs si la validation échoue
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: "Données invalides.",
      errors: errors.array().map((e) => ({
        field: e.type === "field" ? e.path : "unknown",
        message: e.msg,
      })),
    });
    return;
  }

  next();
}
