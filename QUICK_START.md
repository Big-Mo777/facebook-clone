# 🚀 Quick Start - Migration Express → Next.js

## ⚡ 5 minutes pour démarrer

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer `.env`

```bash
# Copier le template
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env
```

Valeurs requises :
```env
DB_HOST=your-railway-host.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone
JWT_SECRET=your-super-secret-key
```

### 3. Démarrer le serveur

```bash
npm run dev
```

Accès : http://localhost:3000

### 4. Tester un endpoint

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## 📁 Fichiers importants

| Fichier | Description |
|---------|-------------|
| `src/lib/db.ts` | Pool MySQL |
| `src/lib/auth.ts` | JWT + bcrypt |
| `src/lib/validation.ts` | Validation inputs |
| `src/app/api/auth/*` | Routes authentification |
| `src/app/api/admin/*` | Routes admin |
| `.env` | Variables d'environnement |

---

## 🔗 Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil (protégé)

### Admin
- `GET /api/admin/users` - Liste users (admin)
- `GET /api/admin/stats` - Statistiques (admin)
- `GET /api/admin/login-attempts` - Tentatives (admin)

---

## 📚 Documentation complète

- **MIGRATION_GUIDE.md** - Guide détaillé de la migration
- **ARCHITECTURE.md** - Architecture complète
- **FRONTEND_INTEGRATION.md** - Utilisation du frontend
- **DEPLOYMENT_CHECKLIST.md** - Checklist de déploiement

---

## 🆘 Problèmes courants

### "Cannot find module 'mysql2'"
```bash
npm install mysql2
```

### "Cannot connect to database"
- Vérifier `DB_HOST`, `DB_USER`, `DB_PASSWORD` dans `.env`
- Vérifier que Railway est accessible

### "JWT_SECRET not configured"
- Ajouter `JWT_SECRET` dans `.env`

---

## ✅ Prochaines étapes

1. ✅ Installer les dépendances
2. ✅ Configurer `.env`
3. ✅ Tester les endpoints
4. ✅ Lire MIGRATION_GUIDE.md
5. ✅ Déployer sur Vercel

**Vous êtes prêt ! 🎉**
