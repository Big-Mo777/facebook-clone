import mysql from "mysql2/promise";

/**
 * Pool de connexions MySQL pour Next.js
 * Réutilisé à travers toutes les API routes
 * ⚠️ IMPORTANT : En serverless (Vercel), chaque invocation peut créer une nouvelle instance
 * Solution : utiliser une variable globale pour réutiliser le pool
 */

let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "facebook_clone",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+00:00",
    charset: "utf8mb4",
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
  });

  return pool;
}

export async function testConnection(): Promise<void> {
  const p = await getPool();
  try {
    const conn = await p.getConnection();
    console.log("✅ MySQL connecté");
    conn.release();
  } catch (err) {
    console.error("❌ Erreur MySQL :", err);
    throw err;
  }
}
