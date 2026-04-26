/**
 * Script pour créer des utilisateurs de test
 * Exécuter avec : node create-test-users.js
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUsers() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facebook_clone',
    charset: 'utf8mb4',
  });

  console.log('🔄 Création des utilisateurs de test...\n');

  const testUsers = [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33612345678',
      password: 'password123',
    },
    {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+33623456789',
      password: 'password123',
    },
    {
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@example.com',
      phone: '+33634567890',
      password: 'password123',
    },
    {
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie.dubois@example.com',
      phone: '+33645678901',
      password: 'password123',
    },
    {
      firstName: 'Luc',
      lastName: 'Moreau',
      email: 'luc.moreau@example.com',
      phone: '+33656789012',
      password: 'password123',
    },
    {
      firstName: 'Emma',
      lastName: 'Laurent',
      email: null, // Utilisateur avec téléphone uniquement
      phone: '+33667890123',
      password: 'password123',
    },
    {
      firstName: 'Thomas',
      lastName: 'Simon',
      email: 'thomas.simon@example.com',
      phone: null, // Utilisateur avec email uniquement
      password: 'password123',
    },
    {
      firstName: 'Julie',
      lastName: 'Michel',
      email: 'julie.michel@example.com',
      phone: '+33689012345',
      password: 'password123',
    },
  ];

  try {
    for (const user of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const [existing] = await conn.execute(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [user.email, user.phone]
      );

      if (existing.length > 0) {
        console.log(`⏭️  ${user.firstName} ${user.lastName} existe déjà`);
        continue;
      }

      // Hacher le mot de passe
      const passwordHash = await bcrypt.hash(user.password, 12);

      // Insérer l'utilisateur
      await conn.execute(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, password_plain, role)
         VALUES (?, ?, ?, ?, ?, ?, 'user')`,
        [
          user.firstName,
          user.lastName,
          user.email,
          user.phone,
          passwordHash,
          user.password, // ⚠️ Mot de passe en clair (dev uniquement)
        ]
      );

      console.log(`✅ ${user.firstName} ${user.lastName} créé`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Téléphone: ${user.phone || 'N/A'}`);
      console.log(`   Mot de passe: ${user.password}`);
      console.log('');
    }

    // Afficher le résumé
    const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM users');
    const [roleCount] = await conn.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    console.log('\n📊 Résumé:');
    console.log(`Total utilisateurs: ${countResult[0].total}`);
    roleCount.forEach(row => {
      console.log(`  - ${row.role}: ${row.count}`);
    });

    console.log('\n🎉 Utilisateurs de test créés avec succès !');
    console.log('\n💡 Tu peux maintenant te connecter avec:');
    console.log('   - jean.dupont@example.com / password123');
    console.log('   - marie.martin@example.com / password123');
    console.log('   - etc.');

  } finally {
    await conn.end();
  }
}

createTestUsers().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
