-- Script pour créer un compte administrateur
-- Exécuter avec : mysql -u root -p < create-admin.sql

USE facebook_clone;

-- Créer un admin (email: admin@test.com, mot de passe: admin123)
INSERT INTO users (first_name, last_name, email, password_hash, password_plain, role)
VALUES (
  'Admin',
  'System',
  'admin@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJqZqZqm',
  'admin123',
  'admin'
);

-- Vérifier la création
SELECT id, first_name, last_name, email, role, password_plain FROM users WHERE role = 'admin';
