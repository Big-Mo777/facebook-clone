import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Charger les variables d'environnement en premier
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ─── Middlewares globaux ─────────────────────────────────────────────────────

// CORS : autoriser uniquement le frontend Next.js
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parser JSON (limite 10kb pour éviter les payloads trop lourds)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Rate limiting global : 100 requêtes / 15 min par IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Trop de requêtes. Veuillez réessayer dans 15 minutes.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  })
);

// Rate limiting strict sur les routes d'auth : 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/** Health check */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API opérationnelle",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/** Routes d'authentification */
app.use("/api/auth", authLimiter, authRoutes);

/** Routes admin (protégées JWT + rôle admin) */
app.use("/api/admin", adminRoutes);

/** Route 404 pour les endpoints inconnus */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint introuvable.",
    code: "NOT_FOUND",
  });
});

// ─── Gestionnaire d'erreurs (doit être en dernier) ───────────────────────────
app.use(errorHandler);

// ─── Démarrage ───────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // Tester la connexion MySQL avant d'accepter des requêtes
  await testConnection();

  app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋 Health check : http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth API     : http://localhost:${PORT}/api/auth`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV || "development"}\n`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Erreur au démarrage :", err);
  process.exit(1);
});
