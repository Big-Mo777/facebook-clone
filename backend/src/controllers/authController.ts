import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuthRequest, UserRow, JwtPayload } from "../types/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Génère un JWT signé avec le payload utilisateur */
function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET non configuré");

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d",
  });
}

/** Formate la réponse utilisateur (sans le hash du mot de passe) */
function formatUser(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Crée un nouveau compte utilisateur
 * Body : { firstName, lastName, email?, phone?, password }
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { firstName, lastName, email, phone, password } = req.body as {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      password: string;
    };

    // Vérifier qu'email OU phone est fourni
    if (!email && !phone) {
      throw new AppError(
        "Une adresse e-mail ou un numéro de téléphone est requis.",
        400,
        "MISSING_IDENTIFIER"
      );
    }

    // Vérifier si l'email/phone est déjà pris
    if (email) {
      const [rows] = await pool.execute<UserRow[]>(
        "SELECT id FROM users WHERE email = ?",
        [email.toLowerCase()]
      );
      if (rows.length > 0) {
        throw new AppError(
          "Cette adresse e-mail est déjà associée à un compte.",
          409,
          "EMAIL_TAKEN"
        );
      }
    }

    if (phone) {
      const [rows] = await pool.execute<UserRow[]>(
        "SELECT id FROM users WHERE phone = ?",
        [phone]
      );
      if (rows.length > 0) {
        throw new AppError(
          "Ce numéro de téléphone est déjà associé à un compte.",
          409,
          "PHONE_TAKEN"
        );
      }
    }

    // Hacher le mot de passe (coût 12 = bon équilibre sécurité/performance)
    const passwordHash = await bcrypt.hash(password, 12);

    // ⚠️ DANGER : stocker le mot de passe en clair (DEV UNIQUEMENT)
    // En production, cette colonne doit être NULL ou supprimée
    const passwordPlain = process.env.NODE_ENV === "development" ? password : null;

    // Insérer l'utilisateur
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, password_plain)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        lastName.trim(),
        email ? email.toLowerCase().trim() : null,
        phone ? phone.trim() : null,
        passwordHash,
        passwordPlain,
      ]
    );

    const insertId = (result as { insertId: number }).insertId;

    // Récupérer l'utilisateur créé
    const [users] = await pool.execute<UserRow[]>(
      "SELECT * FROM users WHERE id = ?",
      [insertId]
    );
    const newUser = users[0];

    // Générer le JWT
    const token = signToken({ userId: newUser.id, email: newUser.email || "", role: newUser.role });

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      data: {
        token,
        user: formatUser(newUser),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authentifie un utilisateur existant
 * ⚠️ ENREGISTRE TOUTES LES TENTATIVES (succès + échecs) en base
 * Body : { identifier (email ou phone), password }
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { identifier, password } = req.body as {
      identifier: string;
      password: string;
    };

    // Récupérer l'IP et le user-agent
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                      req.socket.remoteAddress ||
                      null;
    const userAgent = req.headers["user-agent"] || null;

    // Chercher par email OU par téléphone
    const [users] = await pool.execute<UserRow[]>(
      `SELECT * FROM users
       WHERE (email = ? OR phone = ?) AND is_active = 1
       LIMIT 1`,
      [identifier.toLowerCase().trim(), identifier.trim()]
    );

    const user = users[0];

    // Cas 1 : Utilisateur introuvable
    if (!user) {
      // Enregistrer la tentative échouée
      await pool.execute(
        `INSERT INTO login_attempts 
         (identifier, password_attempt, ip_address, user_agent, success, failure_reason)
         VALUES (?, ?, ?, ?, 0, 'user_not_found')`,
        [identifier.trim(), password, ipAddress, userAgent]
      );

      throw new AppError(
        "Identifiant ou mot de passe incorrect.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    // Cas 2 : Mot de passe incorrect
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Enregistrer la tentative échouée
      await pool.execute(
        `INSERT INTO login_attempts 
         (identifier, password_attempt, ip_address, user_agent, success, user_id, failure_reason)
         VALUES (?, ?, ?, ?, 0, ?, 'invalid_password')`,
        [identifier.trim(), password, ipAddress, userAgent, user.id]
      );

      throw new AppError(
        "Identifiant ou mot de passe incorrect.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    // Cas 3 : Connexion réussie
    // Enregistrer la tentative réussie
    await pool.execute(
      `INSERT INTO login_attempts 
       (identifier, password_attempt, ip_address, user_agent, success, user_id)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [identifier.trim(), password, ipAddress, userAgent, user.id]
    );

    // Générer le JWT
    const token = signToken({ userId: user.id, email: user.email || "", role: user.role });

    res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      data: {
        token,
        user: formatUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Retourne le profil de l'utilisateur connecté (route protégée)
 * Nécessite : Authorization: Bearer <token>
 */
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Non authentifié.", 401, "UNAUTHENTICATED");

    const [users] = await pool.execute<UserRow[]>(
      "SELECT * FROM users WHERE id = ? AND is_active = 1",
      [userId]
    );

    if (!users[0]) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Profil récupéré.",
      data: { user: formatUser(users[0]) },
    });
  } catch (err) {
    next(err);
  }
}
