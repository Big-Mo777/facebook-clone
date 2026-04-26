/**
 * Script pour créer un compte admin avec le bon hash bcrypt
 * Exécuter avec : npx tsx src/scripts/create-admin.ts
 */
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdmin() {
  console.log("🔄 Création du compte admin...\n");

  const adminData = {
    firstName: "Admin",
    lastName: "System",
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
  };

  try {
    // 1. Supprimer tous les anciens admins avec cet email
    console.log("🗑️  Suppression des anciens comptes admin@test.com...");
    await pool.execute("DELETE FROM users WHERE email = ?", [adminData.email]);

    // 2. Générer le hash bcrypt
    console.log("🔐 Génération du hash bcrypt...");
    const passwordHash = await bcrypt.hash(adminData.password, 12);
    console.log(`   Hash généré : ${passwordHash.substring(0, 30)}...`);

    // 3. Insérer le nouvel admin
    console.log("💾 Insertion en base de données...");
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, password_plain, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        adminData.firstName,
        adminData.lastName,
        adminData.email,
        passwordHash,
        adminData.password,
        adminData.role,
      ]
    );

    const insertId = (result as { insertId: number }).insertId;
    console.log(`✅ Admin créé avec l'ID : ${insertId}\n`);

    // 4. Vérifier en relisant depuis la BDD
    console.log("🔍 Vérification...");
    const [users] = await pool.execute(
      "SELECT id, email, password_hash, password_plain, role FROM users WHERE id = ?",
      [insertId]
    );

    const user = (users as any[])[0];
    console.log("   ID             :", user.id);
    console.log("   Email          :", user.email);
    console.log("   Mot de passe   :", user.password_plain);
    console.log("   Rôle           :", user.role);
    console.log("   Hash (début)   :", user.password_hash.substring(0, 30) + "...");

    // 5. Tester le hash
    console.log("\n🧪 Test de validation du mot de passe...");
    const isValid = await bcrypt.compare(adminData.password, user.password_hash);
    console.log(`   Résultat : ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);

    if (isValid) {
      console.log("\n🎉 Compte admin créé avec succès !");
      console.log("\n📋 Identifiants de connexion :");
      console.log(`   Email      : ${adminData.email}`);
      console.log(`   Mot de passe : ${adminData.password}`);
      console.log(`   URL        : http://localhost:3000/admin/login`);
    } else {
      console.error("\n❌ ERREUR : Le hash ne correspond pas au mot de passe !");
    }
  } catch (err) {
    console.error("\n❌ Erreur lors de la création :", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
