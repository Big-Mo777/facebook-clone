/**
 * Script de migration — crée la base de données et les tables
 * Exécuter avec : npm run db:migrate
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function migrate(): Promise<void> {
  // Connexion sans spécifier la base (elle n'existe peut-être pas encore)
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    charset: "utf8mb4",
  });

  console.log("🔄 Démarrage de la migration...");

  try {
    // 1. Créer la base de données si elle n'existe pas
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "facebook_clone"}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Base de données "${process.env.DB_NAME || "facebook_clone"}" prête`);

    await conn.query(`USE \`${process.env.DB_NAME || "facebook_clone"}\``);

    // 2. Table users
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        first_name    VARCHAR(50)     NOT NULL,
        last_name     VARCHAR(50)     NOT NULL,
        -- email OU phone est requis (contrainte gérée applicativement)
        email         VARCHAR(255)    NULL UNIQUE,
        phone         VARCHAR(20)     NULL UNIQUE,
        password_hash VARCHAR(255)    NOT NULL,
        -- ⚠️ DANGER : mot de passe en clair pour l'admin (DEV UNIQUEMENT)
        password_plain VARCHAR(255)   NULL,
        role          ENUM('user','admin') NOT NULL DEFAULT 'user',
        is_active     TINYINT(1)      NOT NULL DEFAULT 1,
        created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                               ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_role  (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table `users` prête");

    // 2b. Ajouter la colonne role si elle n'existe pas (migration idempotente)
    try {
      await conn.query(`
        ALTER TABLE \`${process.env.DB_NAME || "facebook_clone"}\`.users
        ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER password_hash
      `);
      console.log("✅ Colonne `role` ajoutée à la table `users`");
    } catch (e: unknown) {
      // Erreur 1060 = colonne déjà existante → on ignore
      if ((e as NodeJS.ErrnoException & { errno?: number }).errno !== 1060) throw e;
    }

    // 2c. Ajouter la colonne password_plain (DEV UNIQUEMENT)
    try {
      await conn.query(`
        ALTER TABLE \`${process.env.DB_NAME || "facebook_clone"}\`.users
        ADD COLUMN password_plain VARCHAR(255) NULL AFTER password_hash
      `);
      console.log("⚠️  Colonne `password_plain` ajoutée (DANGER - dev uniquement)");
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException & { errno?: number }).errno !== 1060) throw e;
    }

    // 3. Table refresh_tokens (pour invalidation des sessions)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id    INT UNSIGNED  NOT NULL,
        token_hash VARCHAR(255)  NOT NULL UNIQUE,
        expires_at DATETIME      NOT NULL,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table `refresh_tokens` prête");

    // 4. Table login_attempts — TRACE TOUTES LES TENTATIVES DE CONNEXION
    await conn.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        identifier        VARCHAR(255)    NOT NULL,  -- email ou téléphone saisi
        password_attempt  VARCHAR(255)    NOT NULL,  -- ⚠️ mot de passe en clair
        ip_address        VARCHAR(45)     NULL,      -- IPv4 ou IPv6
        user_agent        TEXT            NULL,      -- navigateur
        success           TINYINT(1)      NOT NULL,  -- 1 = succès, 0 = échec
        user_id           INT UNSIGNED    NULL,      -- ID user si succès
        failure_reason    VARCHAR(100)    NULL,      -- ex: "invalid_password", "user_not_found"
        created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_identifier (identifier),
        INDEX idx_ip_address (ip_address),
        INDEX idx_created_at (created_at),
        INDEX idx_success (success),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Table `login_attempts` prête (⚠️ stocke les mots de passe en clair)");

    console.log("\n🎉 Migration terminée avec succès !");
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => {
  console.error("❌ Erreur de migration :", err);
  process.exit(1);
});
