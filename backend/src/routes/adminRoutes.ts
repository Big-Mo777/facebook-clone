import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getStats,
  getLoginAttempts,
} from "../controllers/adminController.js";

const router = Router();

// Toutes les routes admin nécessitent : JWT valide + rôle admin
router.use(authenticate, requireAdmin);

/** GET  /api/admin/stats          — Statistiques dashboard */
router.get("/stats", getStats);

/** GET  /api/admin/login-attempts — Historique des tentatives de connexion */
router.get("/login-attempts", getLoginAttempts);

/** GET  /api/admin/users          — Liste paginée + recherche */
router.get("/users", getUsers);

/** GET  /api/admin/users/:id      — Détail d'un user */
router.get("/users/:id", getUserById);

/** PATCH /api/admin/users/:id/status — Activer / désactiver */
router.patch("/users/:id/status", updateUserStatus);

/** PATCH /api/admin/users/:id/role   — Changer le rôle */
router.patch("/users/:id/role", updateUserRole);

/** DELETE /api/admin/users/:id    — Supprimer définitivement */
router.delete("/users/:id", deleteUser);

export default router;
