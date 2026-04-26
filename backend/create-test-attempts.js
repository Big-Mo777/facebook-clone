/**
 * Script pour créer des tentatives de connexion de test
 * Exécuter avec : node create-test-attempts.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createTestAttempts() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'facebook_clone',
    charset: 'utf8mb4',
  });

  console.log('🔄 Création des tentatives de connexion de test...\n');

  const testAttempts = [
    // Jean Dupont - 3 tentatives (2 échecs, 1 succès)
    {
      identifier: 'jean.dupont@example.com',
      password: 'wrongpass1',
      success: 0,
      failureReason: 'invalid_password',
      userId: 8,
    },
    {
      identifier: 'jean.dupont@example.com',
      password: 'wrongpass2',
      success: 0,
      failureReason: 'invalid_password',
      userId: 8,
    },
    {
      identifier: 'jean.dupont@example.com',
      password: 'password123',
      success: 1,
      failureReason: null,
      userId: 8,
    },
    // Marie Martin - 2 tentatives (1 échec, 1 succès)
    {
      identifier: 'marie.martin@example.com',
      password: 'badpass',
      success: 0,
      failureReason: 'invalid_password',
      userId: 9,
    },
    {
      identifier: 'marie.martin@example.com',
      password: 'password123',
      success: 1,
      failureReason: null,
      userId: 9,
    },
    // Utilisateur inconnu - 2 tentatives
    {
      identifier: 'hacker@evil.com',
      password: 'hack123',
      success: 0,
      failureReason: 'user_not_found',
      userId: null,
    },
    {
      identifier: 'hacker@evil.com',
      password: 'admin',
      success: 0,
      failureReason: 'user_not_found',
      userId: null,
    },
    // Pierre Bernard - 1 tentative réussie
    {
      identifier: 'pierre.bernard@example.com',
      password: 'password123',
      success: 1,
      failureReason: null,
      userId: 10,
    },
    // Téléphone - 2 tentatives
    {
      identifier: '+33612345678',
      password: 'wrong',
      success: 0,
      failureReason: 'invalid_password',
      userId: 8,
    },
    {
      identifier: '+33612345678',
      password: 'password123',
      success: 1,
      failureReason: null,
      userId: 8,
    },
  ];

  try {
    for (const attempt of testAttempts) {
      await conn.execute(
        `INSERT INTO login_attempts 
         (identifier, password_attempt, ip_address, user_agent, success, user_id, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attempt.identifier,
          attempt.password,
          '192.168.1.' + Math.floor(Math.random() * 255), // IP aléatoire
          'Mozilla/5.0 (Test Browser)',
          attempt.success,
          attempt.userId,
          attempt.failureReason,
        ]
      );

      const status = attempt.success ? '✅ Succès' : '❌ Échec';
      console.log(`${status} - ${attempt.identifier} / ${attempt.password}`);
    }

    // Afficher le résumé
    const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM login_attempts');
    const [successCount] = await conn.execute('SELECT COUNT(*) as total FROM login_attempts WHERE success = 1');
    const [failureCount] = await conn.execute('SELECT COUNT(*) as total FROM login_attempts WHERE success = 0');
    const [uniqueCount] = await conn.execute('SELECT COUNT(DISTINCT identifier) as total FROM login_attempts');

    console.log('\n📊 Résumé:');
    console.log(`Total tentatives: ${countResult[0].total}`);
    console.log(`  - Succès: ${successCount[0].total}`);
    console.log(`  - Échecs: ${failureCount[0].total}`);
    console.log(`  - Identifiants uniques: ${uniqueCount[0].total}`);

    console.log('\n🎉 Tentatives de test créées avec succès !');

  } finally {
    await conn.end();
  }
}

createTestAttempts().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
