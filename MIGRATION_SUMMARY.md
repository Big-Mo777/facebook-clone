# 📊 Résumé de la migration Express → Next.js API Routes

## ✅ Ce qui a été fait

### 1. Structure créée

```
src/lib/
├── db.ts              # Pool MySQL réutilisable (serverless-safe)
├── auth.ts            # JWT + bcrypt + cookies
├── validation.ts      # Validation stricte des inputs
├── errors.ts          # Gestion d'erreurs cohérente
├── middleware.ts      # Auth middleware + helpers
└── api.ts             # Client API (mis à jour)

src/app/api/
├── auth/
│   ├── register/route.ts
│   ├── login/route.ts
│   └── me/route.ts
└── admin/
    ├── users/route.ts
    ├── users/[id]/route.ts
    ├── users/[id]/role/route.ts
    ├── stats/route.ts
    └── login-attempts/route.ts
```

### 2. Endpoints migrés

✅ `POST /api/auth/register` - Inscription avec validation  
✅ `POST /api/auth/login` - Connexion avec tracking  
✅ `GET /api/auth/me` - Profil utilisateur (protégé)  
✅ `GET /api/admin/users` - Liste paginée (admin)  
✅ `GET /api/admin/users/[id]` - Détail user (admin)  
✅ `PATCH /api/admin/users/[id]` - Activer/désactiver (admin)  
✅ `PATCH /api/admin/users/[id]/role` - Changer rôle (admin)  
✅ `DELETE /api/admin/users/[id]` - Supprimer user (admin)  
✅ `GET /api/admin/stats` - Statistiques (admin)  
✅ `GET /api/admin/login-attempts` - Tentatives de connexion (admin)  

### 3. Dépendances ajoutées

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.22.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

### 4. Configuration

- ✅ `.env` mis à jour avec variables MySQL + JWT
- ✅ `.env.example` mis à jour
- ✅ `package.json` mis à jour

---

## 🚀 Prochaines étapes

### Étape 1 : Installer les dépendances

```bash
npm install
```

### Étape 2 : Configurer les variables d'environnement

Mettre à jour `.env` avec vos vraies valeurs :

```env
# Base de données Railway
DB_HOST=your-railway-host.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone

# JWT (générer une clé forte)
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
```

### Étape 3 : Tester localement

```bash
# Démarrer le serveur de développement
npm run dev

# Tester les endpoints
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Étape 4 : Vérifier les pages frontend

Les pages admin doivent maintenant appeler les API Routes :

```typescript
// src/lib/api.ts utilise NEXT_PUBLIC_API_URL = http://localhost:3000
// Les appels vont vers /api/auth/*, /api/admin/*
```

### Étape 5 : Déployer sur Vercel

1. **Supprimer le backend Express** (optionnel pour l'instant)
   ```bash
   rm -rf backend/
   ```

2. **Mettre à jour les variables d'environnement sur Vercel**
   - Aller sur https://vercel.com/dashboard
   - Sélectionner le projet
   - Settings → Environment Variables
   - Ajouter :
     - `DB_HOST`
     - `DB_PORT`
     - `DB_USER`
     - `DB_PASSWORD`
     - `DB_NAME`
     - `JWT_SECRET`
     - `JWT_EXPIRES_IN`
     - `NODE_ENV=production`

3. **Déployer**
   ```bash
   git add .
   git commit -m "chore: migrate backend to Next.js API Routes"
   git push
   ```

---

## 🔍 Vérification

### Checklist avant déploiement

- [ ] `npm install` fonctionne sans erreurs
- [ ] `npm run dev` démarre sans erreurs
- [ ] Les endpoints répondent correctement
- [ ] La validation des inputs fonctionne
- [ ] Les tokens JWT sont générés
- [ ] Les mots de passe sont hashés
- [ ] Les routes admin sont protégées
- [ ] Le tracking des tentatives fonctionne
- [ ] Les pages frontend appellent les bonnes URLs

### Tests manuels

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Réponse attendue :
# {
#   "success": true,
#   "message": "Compte créé avec succès",
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { "id": 1, "firstName": "Test", ... }
#   }
# }

# 2. Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'

# 3. Profil (remplacer TOKEN par le token reçu)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# 4. Admin - Liste des users (remplacer ADMIN_TOKEN)
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📚 Documentation

- **MIGRATION_GUIDE.md** : Guide complet de la migration
- **src/lib/db.ts** : Configuration du pool MySQL
- **src/lib/auth.ts** : Utilitaires JWT et bcrypt
- **src/lib/validation.ts** : Validation des inputs
- **src/lib/errors.ts** : Gestion d'erreurs
- **src/lib/middleware.ts** : Middleware d'authentification

---

## ⚠️ Points importants

### Serverless (Vercel)

- Le pool MySQL est réutilisé avec une variable globale
- `enableKeepAlive` est activé pour éviter les timeouts
- Les connexions sont limitées à 10 simultanées

### Sécurité

- Les mots de passe sont hashés avec bcrypt (coût 12)
- Les JWT sont signés avec une clé secrète
- Les inputs sont validés strictement
- Les routes admin sont protégées par JWT + vérification du rôle

### Performance

- Pas d'appels réseau frontend → backend (même domaine)
- Latence réduite
- Compression automatique par Next.js

---

## 🎯 Résumé

Vous avez maintenant une **architecture Next.js complète** avec :

✅ API Routes remplaçant Express  
✅ Pool MySQL optimisé pour serverless  
✅ JWT pour l'authentification  
✅ Validation stricte des inputs  
✅ Gestion d'erreurs cohérente  
✅ Routes admin protégées  
✅ Tracking des tentatives de connexion  
✅ Prêt pour Vercel  

**Temps estimé pour terminer :**
- Installation + configuration : 30 min
- Tests locaux : 1-2 heures
- Déploiement : 15 min

**Total : 2-3 heures pour une migration complète et testée**

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que les variables d'environnement sont correctes
2. Vérifiez que la base de données est accessible
3. Consultez les logs : `npm run dev` affiche les erreurs
4. Testez les endpoints avec curl ou Postman
5. Vérifiez les types TypeScript : `npx tsc --noEmit`

---

## 🗑️ Nettoyage (après vérification complète)

Une fois que tout fonctionne en production :

```bash
# Supprimer le backend Express
rm -rf backend/

# Supprimer les fichiers inutiles
rm -f backend/.env backend/package.json backend/tsconfig.json

# Commit
git add .
git commit -m "chore: remove Express backend (fully migrated to Next.js)"
git push
```

**Félicitations ! Vous avez une architecture monolithique Next.js prête pour la production ! 🎉**
