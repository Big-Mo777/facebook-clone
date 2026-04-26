# 🛡️ Guide d'administration — Facebook Clone

## ⚠️ AVERTISSEMENT SÉCURITÉ

**Ce système stocke les mots de passe en clair dans la colonne `password_plain` de la base de données.**

- ✅ **Acceptable** : environnement de développement local uniquement
- ❌ **INTERDIT** : production, staging, ou tout environnement accessible publiquement
- 🔒 **Recommandation** : supprimer la colonne `password_plain` avant tout déploiement

---

## 📋 Prérequis

1. Backend Node.js démarré (`cd backend && npm run dev`)
2. Frontend Next.js démarré (`npm run dev`)
3. Base de données MySQL avec migration appliquée (`npm run db:migrate`)
4. Un compte admin créé manuellement en base

---

## 🔧 Créer un compte admin

### Option 1 : Via SQL direct

```sql
USE facebook_clone;

-- Créer un admin (mot de passe : "admin123")
INSERT INTO users (first_name, last_name, email, password_hash, password_plain, role)
VALUES (
  'Admin',
  'System',
  'admin@facebook.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJqZqZqm', -- hash de "admin123"
  'admin123',
  'admin'
);
```

### Option 2 : Via l'API register puis mise à jour SQL

1. Créer un compte normal via `/api/auth/register`
2. Mettre à jour le rôle en SQL :

```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

---

## 🚀 Accéder à l'interface admin

1. **Se connecter** : `http://localhost:3000/` avec un compte admin
2. **Accéder au dashboard** : `http://localhost:3000/admin`

---

## 📊 Fonctionnalités disponibles

### Dashboard (`/admin`)

- **Statistiques en temps réel** :
  - Total utilisateurs
  - Actifs / Inactifs
  - Admins / Users
  - Nouveaux inscrits (aujourd'hui, 7j, 30j)

- **Liste des utilisateurs** :
  - Recherche par nom, email, téléphone
  - Filtres par rôle (user/admin)
  - Filtres par statut (actif/inactif)
  - Pagination (20 par page)
  - **Affichage du mot de passe en clair** ⚠️

### Détail utilisateur (`/admin/users/:id`)

- **Informations complètes** :
  - ID, nom, prénom, email, téléphone
  - Rôle, statut, dates de création/modification
  - **Mot de passe en clair** (encadré rouge avec avertissement)
  - Hash bcrypt (tronqué)

- **Actions disponibles** :
  - ✅ Activer / 🔒 Désactiver le compte
  - 👑 Promouvoir en admin / 👤 Rétrograder en user
  - 🗑️ Supprimer définitivement (avec double confirmation)

---

## 🔐 Sécurité

### Protections en place

- ✅ Routes `/api/admin/*` protégées par JWT + vérification rôle admin
- ✅ Impossible de modifier son propre statut/rôle
- ✅ Impossible de se supprimer soi-même
- ✅ Rate limiting : 100 req/15min (global), 10 req/15min (auth)
- ✅ Validation des inputs côté serveur (express-validator)
- ✅ Messages d'erreur génériques (pas de fuite d'info)

### Vulnérabilités connues (DEV UNIQUEMENT)

- ⚠️ **Mots de passe en clair** dans `users.password_plain`
- ⚠️ **Exposition des mots de passe** via l'API admin

### Avant mise en production

1. **Supprimer la colonne `password_plain`** :
   ```sql
   ALTER TABLE users DROP COLUMN password_plain;
   ```

2. **Retirer l'affichage du mot de passe** dans :
   - `backend/src/controllers/adminController.ts` (fonction `formatUserAdmin`)
   - `src/app/admin/page.tsx` (colonne tableau)
   - `src/app/admin/users/[id]/page.tsx` (section rouge)

3. **Mettre `NODE_ENV=production`** dans `.env`

---

## 🧪 Tests

### Tester l'accès admin

```bash
# 1. Créer un admin en SQL (voir ci-dessus)

# 2. Se connecter via l'API
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@facebook.local","password":"admin123"}'

# Copier le token JWT retourné

# 3. Tester l'accès aux stats
curl http://localhost:4000/api/admin/stats \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"

# 4. Lister les users
curl "http://localhost:4000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### Tester le refus d'accès (user normal)

```bash
# Se connecter avec un compte user
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@test.com","password":"password123"}'

# Tenter d'accéder aux stats → doit retourner 403 Forbidden
curl http://localhost:4000/api/admin/stats \
  -H "Authorization: Bearer TOKEN_USER"
```

---

## 📁 Structure des fichiers

```
backend/src/
├── controllers/
│   ├── authController.ts       ← register, login, getMe
│   └── adminController.ts      ← getUsers, getUserById, updateUserStatus, etc.
├── routes/
│   ├── authRoutes.ts
│   └── adminRoutes.ts          ← /api/admin/*
├── middleware/
│   ├── authMiddleware.ts       ← authenticate, requireAdmin
│   ├── errorHandler.ts
│   └── validate.ts
└── types/index.ts              ← UserRow avec password_plain

src/
├── app/
│   └── admin/
│       ├── page.tsx            ← Dashboard + liste users
│       └── users/[id]/page.tsx ← Détail user + actions
└── lib/
    └── api.ts                  ← Fonctions fetch (getAdminUsers, etc.)
```

---

## 🐛 Dépannage

### Erreur "Accès refusé"

- Vérifier que le compte est bien `role = 'admin'` en SQL
- Vérifier que le JWT contient `"role":"admin"` (décoder sur jwt.io)
- Vider le localStorage et se reconnecter

### Mot de passe affiché "[Hash bcrypt uniquement]"

- La colonne `password_plain` est NULL → l'utilisateur a été créé avant la migration
- Solution : réinitialiser le mot de passe ou mettre à jour manuellement en SQL

### Erreur CORS

- Vérifier que `FRONTEND_URL=http://localhost:3000` dans `backend/.env`
- Vérifier que le backend tourne sur le port 4000

---

## 📞 Support

Pour toute question, consulter :
- `backend/src/controllers/adminController.ts` — logique métier
- `backend/src/routes/adminRoutes.ts` — endpoints disponibles
- `src/lib/api.ts` — fonctions d'appel API côté frontend
