/**
 * Script pour vérifier les utilisateurs dans la base de données
 * Exécuter avec : node check-users.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facebook_clone',
    charset: 'utf8mb4',
  });

  console.log('🔍 Vérification des utilisateurs dans la base de données...\n');

  try {
    // Compter tous les users
    const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM users');
    console.log('📊 Total utilisateurs:', countResult[0].total);

    // Compter par rôle
    const [roleCount] = await conn.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    console.log('\n👥 Répartition par rôle:');
    roleCount.forEach(row => {
      console.log(`  - ${row.role}: ${row.count}`);
    });

    // Lister tous les users
    const [users] = await conn.execute(`
      SELECT id, first_name, last_name, email, phone, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log('\n📋 Liste complète des utilisateurs:\n');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Nom: ${user.first_name} ${user.last_name}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Téléphone: ${user.phone || 'N/A'}`);
      console.log(`  Rôle: ${user.role}`);
      console.log(`  Actif: ${user.is_active ? 'Oui' : 'Non'}`);
      console.log(`  Créé le: ${user.created_at}`);
      console.log('---');
    });

  } finally {
    await conn.end();
  }
}

checkUsers().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
