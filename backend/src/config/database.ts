import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pool de connexions MySQL
 * Utilise mysql2/promise pour l'API async/await
 * Le pool gère automatiquement les reconnexions
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "facebook_clone",
  waitForConnections: true,
  connectionLimit: 10,       // max 10 connexions simultanées
  queueLimit: 0,             // file d'attente illimitée
  timezone: "+00:00",        // stocker les dates en UTC
  charset: "utf8mb4",        // support des emojis
});

/** Teste la connexion au démarrage */
export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connecté avec succès");
    conn.release();
  } catch (err) {
    console.error("❌ Impossible de se connecter à MySQL :", err);
    process.exit(1); // arrêt si la BDD est inaccessible
  }
}

export default pool;
