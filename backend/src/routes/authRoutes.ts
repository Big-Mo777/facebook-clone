import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// ─── Règles de validation ────────────────────────────────────────────────────

const registerRules = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("Le prénom est requis.")
    .isLength({ min: 2, max: 50 }).withMessage("Le prénom doit contenir entre 2 et 50 caractères."),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Le nom est requis.")
    .isLength({ min: 2, max: 50 }).withMessage("Le nom doit contenir entre 2 et 50 caractères."),

  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail().withMessage("L'adresse e-mail est invalide.")
    .normalizeEmail(),

  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("any").withMessage("Le numéro de téléphone est invalide."),

  body("password")
    .isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères.")
    .matches(/\d/).withMessage("Le mot de passe doit contenir au moins un chiffre."),
];

const loginRules = [
  body("identifier")
    .trim()
    .notEmpty().withMessage("L'adresse e-mail ou le numéro de téléphone est requis."),

  body("password")
    .notEmpty().withMessage("Le mot de passe est requis."),
];

// ─── Routes ─────────────────────────────────────────────────────────────────

/** POST /api/auth/register — Inscription */
router.post("/register", registerRules, validate, register);

/** POST /api/auth/login — Connexion */
router.post("/login", loginRules, validate, login);

/** GET /api/auth/me — Profil (protégé) */
router.get("/me", authenticate, getMe);

export default router;
