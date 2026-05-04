# ✅ Checklist de déploiement - Migration Express → Next.js

## 🔧 Avant de commencer

- [ ] Cloner le repo ou avoir accès au code
- [ ] Node.js 18+ installé
- [ ] npm ou yarn disponible
- [ ] Accès à la base de données MySQL (Railway)
- [ ] Accès à Vercel

---

## 📦 Phase 1 : Installation locale

### 1.1 Installer les dépendances

```bash
npm install
```

**Vérifier :**
- [ ] Pas d'erreurs d'installation
- [ ] `node_modules/` créé
- [ ] `package-lock.json` mis à jour

### 1.2 Vérifier la structure

```bash
# Vérifier que les fichiers existent
ls -la src/lib/db.ts
ls -la src/lib/auth.ts
ls -la src/lib/validation.ts
ls -la src/lib/errors.ts
ls -la src/lib/middleware.ts
ls -la src/app/api/auth/register/route.ts
ls -la src/app/api/auth/login/route.ts
ls -la src/app/api/admin/users/route.ts
```

**Vérifier :**
- [ ] Tous les fichiers existent
- [ ] Pas de fichiers manquants

---

## 🔐 Phase 2 : Configuration

### 2.1 Mettre à jour `.env`

```env
# Base de données (Railway)
DB_HOST=your-railway-host.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Environnement
NODE_ENV=development
```

**Vérifier :**
- [ ] `DB_HOST` correct (Railway)
- [ ] `DB_USER` et `DB_PASSWORD` corrects
- [ ] `DB_NAME` correct
- [ ] `JWT_SECRET` défini (min 32 caractères)
- [ ] `NEXT_PUBLIC_API_URL` correct

### 2.2 Tester la connexion à la base de données

```bash
npm run dev
```

**Vérifier dans les logs :**
- [ ] `✅ MySQL connecté` (ou message similaire)
- [ ] Pas d'erreur de connexion
- [ ] Pas d'erreur de démarrage

---

## 🧪 Phase 3 : Tests locaux

### 3.1 Tester l'inscription

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "role": "user",
      "createdAt": "2024-..."
    }
  }
}
```

**Vérifier :**
- [ ] Réponse 201 (Created)
- [ ] Token généré
- [ ] User retourné
- [ ] Pas d'erreur

### 3.2 Tester la connexion

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

**Vérifier :**
- [ ] Réponse 200 (OK)
- [ ] Token généré
- [ ] User retourné
- [ ] Tentative de connexion enregistrée en base

### 3.3 Tester le profil (protégé)

```bash
# Remplacer TOKEN par le token reçu
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Profil récupéré",
  "data": {
    "user": { ... }
  }
}
```

**Vérifier :**
- [ ] Réponse 200 (OK)
- [ ] User retourné
- [ ] Pas d'erreur d'authentification

### 3.4 Tester les routes admin

```bash
# Créer un admin en base (SQL)
UPDATE users SET role = 'admin' WHERE id = 1;

# Récupérer un nouveau token pour l'admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "test@example.com", "password": "password123"}'

# Lister les users (remplacer ADMIN_TOKEN)
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Utilisateurs récupérés",
  "data": {
    "users": [ ... ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Vérifier :**
- [ ] Réponse 200 (OK)
- [ ] Liste des users retournée
- [ ] Pagination correcte
- [ ] Pas d'erreur d'authentification

### 3.5 Tester les statistiques

```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Statistiques récupérées",
  "data": {
    "stats": {
      "total": 1,
      "active": 1,
      "inactive": 0,
      "admins": 1,
      "users": 0,
      "newToday": 1,
      "newLast7Days": 1,
      "newLast30Days": 1
    }
  }
}
```

**Vérifier :**
- [ ] Réponse 200 (OK)
- [ ] Statistiques correctes
- [ ] Pas d'erreur

### 3.6 Tester les tentatives de connexion

```bash
curl -X GET "http://localhost:3000/api/admin/login-attempts?page=1&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Tentatives de connexion récupérées",
  "data": {
    "attempts": [ ... ],
    "pagination": { ... }
  }
}
```

**Vérifier :**
- [ ] Réponse 200 (OK)
- [ ] Tentatives retournées
- [ ] Pagination correcte
- [ ] Pas d'erreur

---

## 🔒 Phase 4 : Vérification de sécurité

### 4.1 Vérifier la validation des inputs

```bash
# Email invalide
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "invalid-email",
    "password": "password123"
  }'
```

**Vérifier :**
- [ ] Réponse 400 (Bad Request)
- [ ] Message d'erreur clair
- [ ] Code d'erreur : `INVALID_EMAIL`

### 4.2 Vérifier la protection des routes admin

```bash
# Sans token
curl -X GET http://localhost:3000/api/admin/users
```

**Vérifier :**
- [ ] Réponse 401 (Unauthorized)
- [ ] Message : "Token manquant"

```bash
# Avec token invalide
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer invalid-token"
```

**Vérifier :**
- [ ] Réponse 401 (Unauthorized)
- [ ] Message : "Token invalide ou expiré"

```bash
# Avec token d'utilisateur normal (pas admin)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer USER_TOKEN"
```

**Vérifier :**
- [ ] Réponse 403 (Forbidden)
- [ ] Message : "Accès réservé aux administrateurs"

### 4.3 Vérifier le hash des mots de passe

```bash
# Vérifier en base que le mot de passe est hashé
SELECT id, email, password_hash FROM users WHERE id = 1;
```

**Vérifier :**
- [ ] `password_hash` commence par `$2a$` ou `$2b$` (bcrypt)
- [ ] Pas de mot de passe en clair
- [ ] Hash différent pour chaque utilisateur

### 4.4 Vérifier le JWT

```bash
# Décoder le token sur https://jwt.io
# Vérifier que le payload contient :
# - userId
# - email
# - role
# - exp (expiration)
```

**Vérifier :**
- [ ] Payload correct
- [ ] Signature valide
- [ ] Expiration correcte (7 jours)

---

## 🚀 Phase 5 : Préparation au déploiement

### 5.1 Vérifier la build

```bash
npm run build
```

**Vérifier :**
- [ ] Build réussie
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'avertissements critiques
- [ ] `.next/` créé

### 5.2 Vérifier les types TypeScript

```bash
npx tsc --noEmit
```

**Vérifier :**
- [ ] Pas d'erreurs de type
- [ ] Tous les types sont corrects

### 5.3 Vérifier les lints

```bash
npm run lint
```

**Vérifier :**
- [ ] Pas d'erreurs critiques
- [ ] Code formaté correctement

### 5.4 Nettoyer les fichiers temporaires

```bash
# Supprimer les fichiers de développement
rm -rf .next/
rm -rf node_modules/.cache/
```

**Vérifier :**
- [ ] Fichiers temporaires supprimés
- [ ] Repo propre

---

## 🌐 Phase 6 : Déploiement sur Vercel

### 6.1 Configurer les variables d'environnement

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet
3. Settings → Environment Variables
4. Ajouter les variables :

```
DB_HOST=your-railway-host.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

**Vérifier :**
- [ ] Toutes les variables ajoutées
- [ ] Pas de typos
- [ ] Valeurs correctes

### 6.2 Déployer

```bash
git add .
git commit -m "chore: migrate backend to Next.js API Routes"
git push
```

**Vérifier :**
- [ ] Push réussi
- [ ] Vercel détecte le changement
- [ ] Build en cours sur Vercel

### 6.3 Attendre la build

- [ ] Build réussie (vérifier sur Vercel)
- [ ] Pas d'erreurs de build
- [ ] Déploiement réussi

---

## ✅ Phase 7 : Vérification en production

### 7.1 Tester les endpoints en production

```bash
# Remplacer https://your-domain.vercel.app par votre URL

# Inscription
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Prod",
    "lastName": "Test",
    "email": "prod@example.com",
    "password": "password123"
  }'

# Connexion
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "prod@example.com",
    "password": "password123"
  }'

# Profil
curl -X GET https://your-domain.vercel.app/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

**Vérifier :**
- [ ] Réponses correctes
- [ ] Pas d'erreurs 500
- [ ] Tokens générés
- [ ] Base de données accessible

### 7.2 Tester le frontend

1. Aller sur https://your-domain.vercel.app
2. Tester la connexion
3. Tester les pages admin
4. Vérifier les appels API dans DevTools

**Vérifier :**
- [ ] Pages chargent correctement
- [ ] Connexion fonctionne
- [ ] Admin accessible
- [ ] Pas d'erreurs console

### 7.3 Vérifier les logs Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet
3. Deployments → Logs
4. Vérifier qu'il n'y a pas d'erreurs

**Vérifier :**
- [ ] Pas d'erreurs critiques
- [ ] Logs normaux
- [ ] Pas de timeouts

---

## 🧹 Phase 8 : Nettoyage (optionnel)

### 8.1 Supprimer le backend Express

```bash
rm -rf backend/
```

**Vérifier :**
- [ ] Dossier `backend/` supprimé
- [ ] Pas de fichiers Express restants

### 8.2 Mettre à jour package.json

Supprimer les scripts Express (s'il y en a) :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

**Vérifier :**
- [ ] Pas de scripts Express
- [ ] Scripts Next.js corrects

### 8.3 Commit final

```bash
git add .
git commit -m "chore: remove Express backend (fully migrated to Next.js)"
git push
```

**Vérifier :**
- [ ] Push réussi
- [ ] Vercel redéploie automatiquement

---

## 📊 Résumé final

### Checklist complète

- [ ] Dépendances installées
- [ ] Configuration `.env` correcte
- [ ] Connexion MySQL fonctionnelle
- [ ] Tous les endpoints testés localement
- [ ] Validation des inputs fonctionne
- [ ] Sécurité vérifiée (JWT, bcrypt, etc.)
- [ ] Build réussie
- [ ] Types TypeScript corrects
- [ ] Variables d'environnement sur Vercel
- [ ] Déploiement réussi
- [ ] Tests en production réussis
- [ ] Frontend fonctionne
- [ ] Backend Express supprimé (optionnel)

### Temps estimé

- Installation + configuration : 30 min
- Tests locaux : 1-2 heures
- Déploiement : 15 min
- Vérification en production : 30 min

**Total : 2-3 heures**

---

## 🆘 Troubleshooting

### Erreur : "Cannot find module 'mysql2'"

```bash
npm install mysql2
```

### Erreur : "JWT_SECRET not configured"

Vérifier que `JWT_SECRET` est défini dans `.env`

### Erreur : "Cannot connect to database"

- Vérifier `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Vérifier que Railway est accessible
- Vérifier les firewall rules

### Erreur : "Token invalid or expired"

- Vérifier que `JWT_SECRET` est le même en local et en production
- Vérifier que le token n'a pas expiré
- Vérifier le format du header Authorization

### Erreur : "Forbidden - Admin access required"

- Vérifier que l'utilisateur a le rôle `admin` en base
- Vérifier que le token est valide
- Vérifier que le rôle est inclus dans le JWT

---

## ✨ Félicitations !

Vous avez migré avec succès votre backend Express vers Next.js API Routes ! 🎉

**Prochaines étapes :**
- Monitorer les logs en production
- Optimiser les performances si nécessaire
- Ajouter du caching si pertinent
- Implémenter du rate limiting si nécessaire
