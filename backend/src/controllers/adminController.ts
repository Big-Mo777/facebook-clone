import { Response, NextFunction } from "express";
import pool from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuthRequest, UserRow, LoginAttemptRow } from "../types/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formate un user pour l'admin — inclut toutes les infos y compris le mot de passe
 * ⚠️ DANGER : expose le mot de passe en clair (dev uniquement)
 */
function formatUserAdmin(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: Boolean(user.is_active),
    // ⚠️ Mot de passe en clair (si stocké) — JAMAIS en production
    password: user.password_plain || "[Hash bcrypt uniquement]",
    passwordHash: user.password_hash.substring(0, 20) + "...", // hash tronqué
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Liste paginée de tous les utilisateurs avec recherche et filtres
 * Query params : page, limit, search, role, isActive, sortBy, sortOrder
 */
export async function getUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || "").trim();
    const role = req.query.role as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const sortBy = ["id", "first_name", "last_name", "email", "created_at"].includes(
      req.query.sortBy as string
    ) ? req.query.sortBy as string : "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    console.log("📊 getUsers appelé avec:", { page, limit, offset, search, role, isActive });

    // Construction dynamique de la clause WHERE
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(
        "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)"
      );
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (role === "admin" || role === "user") {
      conditions.push("role = ?");
      params.push(role);
    }

    if (isActive === "true") {
      conditions.push("is_active = 1");
    } else if (isActive === "false") {
      conditions.push("is_active = 0");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    console.log("🔍 Clause WHERE:", where);
    console.log("🔍 Params:", params);

    // Requête de comptage total
    const countQuery = `SELECT COUNT(*) as total FROM users ${where}`;
    console.log("🔢 Count query:", countQuery);
    const [countRows] = await pool.execute<(UserRow & { total: number })[]>(
      countQuery,
      params
    );
    const total = (countRows[0] as unknown as { total: number }).total;
    console.log("📈 Total users trouvés:", total);

    // Requête paginée
    const usersQuery = `SELECT * FROM users ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
    console.log("👥 Users query:", usersQuery);
    const [users] = await pool.execute<UserRow[]>(
      usersQuery,
      params
    );
    console.log("✅ Nombre d'users récupérés:", users.length);
    console.log("👤 Premier user:", users[0] ? { id: users[0].id, email: users[0].email, role: users[0].role } : "AUCUN");

    res.json({
      success: true,
      message: "Utilisateurs récupérés.",
      data: {
        users: users.map(formatUserAdmin),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (err) {
    console.error("💥 Erreur dans getUsers:", err);
    next(err);
  }
}

/**
 * GET /api/admin/users/:id
 * Détail complet d'un utilisateur
 */
export async function getUserById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) throw new AppError("ID invalide.", 400, "INVALID_ID");

    const [users] = await pool.execute<UserRow[]>(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (!users[0]) throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");

    res.json({
      success: true,
      message: "Utilisateur récupéré.",
      data: { user: formatUserAdmin(users[0]) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Active ou désactive un compte utilisateur
 * Body : { isActive: boolean }
 */
export async function updateUserStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) throw new AppError("ID invalide.", 400, "INVALID_ID");

    // Empêcher l'admin de se désactiver lui-même
    if (userId === req.user?.userId) {
      throw new AppError("Vous ne pouvez pas modifier votre propre statut.", 400, "SELF_MODIFY");
    }

    const { isActive } = req.body as { isActive: boolean };
    if (typeof isActive !== "boolean") {
      throw new AppError("Le champ isActive doit être un booléen.", 400, "INVALID_BODY");
    }

    const [result] = await pool.execute(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [isActive ? 1 : 0, userId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    res.json({
      success: true,
      message: `Compte ${isActive ? "activé" : "désactivé"} avec succès.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Change le rôle d'un utilisateur (user ↔ admin)
 * Body : { role: "user" | "admin" }
 */
export async function updateUserRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) throw new AppError("ID invalide.", 400, "INVALID_ID");

    if (userId === req.user?.userId) {
      throw new AppError("Vous ne pouvez pas modifier votre propre rôle.", 400, "SELF_MODIFY");
    }

    const { role } = req.body as { role: string };
    if (role !== "user" && role !== "admin") {
      throw new AppError("Rôle invalide. Valeurs acceptées : user, admin.", 400, "INVALID_ROLE");
    }

    const [result] = await pool.execute(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    res.json({
      success: true,
      message: `Rôle mis à jour : ${role}.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Supprime définitivement un utilisateur
 */
export async function deleteUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) throw new AppError("ID invalide.", 400, "INVALID_ID");

    if (userId === req.user?.userId) {
      throw new AppError("Vous ne pouvez pas supprimer votre propre compte.", 400, "SELF_MODIFY");
    }

    const [result] = await pool.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Utilisateur supprimé définitivement.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/stats
 * Statistiques globales du dashboard
 */
export async function getStats(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [rows] = await pool.execute<(UserRow & Record<string, number>)[]>(`
      SELECT
        COUNT(*)                                    AS total,
        SUM(is_active = 1)                          AS active,
        SUM(is_active = 0)                          AS inactive,
        SUM(role = 'admin')                         AS admins,
        SUM(role = 'user')                          AS users,
        SUM(DATE(created_at) = CURDATE())           AS today,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))  AS last7days,
        SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS last30days
      FROM users
    `);

    const s = rows[0] as unknown as Record<string, number>;

    res.json({
      success: true,
      message: "Statistiques récupérées.",
      data: {
        stats: {
          total: s.total || 0,
          active: s.active || 0,
          inactive: s.inactive || 0,
          admins: s.admins || 0,
          users: s.users || 0,
          newToday: s.today || 0,
          newLast7Days: s.last7days || 0,
          newLast30Days: s.last30days || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/admin/login-attempts
 * Liste paginée de toutes les tentatives de connexion (succès + échecs)
 * Query params : page, limit, success (true/false/all), search, unique (true/false)
 */
export async function getLoginAttempts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || "").trim();
    const successFilter = req.query.success as string | undefined;
    const uniqueOnly = req.query.unique === "true"; // Nouveau paramètre pour dédoublonner

    // Construction dynamique de la clause WHERE
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(identifier LIKE ? OR ip_address LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like);
    }

    if (successFilter === "true") {
      conditions.push("success = 1");
    } else if (successFilter === "false") {
      conditions.push("success = 0");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (uniqueOnly) {
      // MODE UNIQUE : Une seule entrée par identifiant (la plus récente)
      // Utilise une sous-requête pour récupérer l'ID de la dernière tentative par identifiant
      const subquery = `
        SELECT MAX(id) as max_id
        FROM login_attempts
        ${where}
        GROUP BY identifier
      `;

      // Comptage total d'identifiants uniques
      const [countRows] = await pool.execute<(LoginAttemptRow & { total: number })[]>(
        `SELECT COUNT(DISTINCT identifier) as total FROM login_attempts ${where}`,
        params
      );
      const total = (countRows[0] as unknown as { total: number }).total;

      // Requête paginée avec dédoublonnage
      const [attempts] = await pool.execute<(LoginAttemptRow & {
        user_first_name?: string;
        user_last_name?: string;
        user_email?: string;
      })[]>(
        `SELECT 
           la.*,
           u.first_name as user_first_name,
           u.last_name as user_last_name,
           u.email as user_email
         FROM login_attempts la
         LEFT JOIN users u ON la.user_id = u.id
         WHERE la.id IN (${subquery})
         ORDER BY la.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      res.json({
        success: true,
        message: "Tentatives de connexion uniques récupérées.",
        data: {
          attempts: attempts.map((a) => ({
            id: a.id,
            identifier: a.identifier,
            passwordAttempt: a.password_attempt, // ⚠️ mot de passe en clair
            ipAddress: a.ip_address,
            userAgent: a.user_agent,
            success: Boolean(a.success),
            userId: a.user_id,
            userName: a.user_id
              ? `${a.user_first_name} ${a.user_last_name}`
              : null,
            userEmail: a.user_email || null,
            failureReason: a.failure_reason,
            createdAt: a.created_at,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } else {
      // MODE NORMAL : Toutes les tentatives
      // Comptage total
      const [countRows] = await pool.execute<(LoginAttemptRow & { total: number })[]>(
        `SELECT COUNT(*) as total FROM login_attempts ${where}`,
        params
      );
      const total = (countRows[0] as unknown as { total: number }).total;

      // Requête paginée avec jointure sur users pour récupérer le nom
      const [attempts] = await pool.execute<(LoginAttemptRow & {
        user_first_name?: string;
        user_last_name?: string;
        user_email?: string;
      })[]>(
        `SELECT 
           la.*,
           u.first_name as user_first_name,
           u.last_name as user_last_name,
           u.email as user_email
         FROM login_attempts la
         LEFT JOIN users u ON la.user_id = u.id
         ${where}
         ORDER BY la.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      res.json({
        success: true,
        message: "Tentatives de connexion récupérées.",
        data: {
          attempts: attempts.map((a) => ({
            id: a.id,
            identifier: a.identifier,
            passwordAttempt: a.password_attempt, // ⚠️ mot de passe en clair
            ipAddress: a.ip_address,
            userAgent: a.user_agent,
            success: Boolean(a.success),
            userId: a.user_id,
            userName: a.user_id
              ? `${a.user_first_name} ${a.user_last_name}`
              : null,
            userEmail: a.user_email || null,
            failureReason: a.failure_reason,
            createdAt: a.created_at,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    }
  } catch (err) {
    next(err);
  }
}
