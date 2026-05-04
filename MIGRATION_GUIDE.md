# 🚀 Guide de Migration : Express → Next.js API Routes

## 📋 Vue d'ensemble

Ce guide explique comment migrer votre backend Express vers les API Routes de Next.js (App Router). L'objectif est de **supprimer complètement le backend Express** et d'avoir une architecture **monolithique Next.js** déployée sur Vercel.

### Avantages de cette migration

✅ **Déploiement simplifié** : Un seul projet sur Vercel (pas de backend séparé)  
✅ **Latence réduite** : Pas d'appels réseau frontend → backend  
✅ **Coûts réduits** : Moins de serveurs à maintenir  
✅ **Développement plus rapide** : Tout dans un seul repo  
✅ **Serverless optimisé** : Vercel gère automatiquement la scalabilité  

---

## 🏗️ Architecture finale

```
facebook-clone/
├── src/
│   ├── app/
│   │   ├── api/                    # ← API Routes (remplace Express)
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── me/route.ts
│   │   │   └── admin/
│   │   │       ├── users/route.ts
│   │   │       ├── users/[id]/route.ts
│   │   │       ├── users/[id]/role/route.ts
│   │   │       ├── stats/route.ts
│   │   │       └── login-attempts/route.ts
│   │   ├── admin/                  # Pages frontend
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   │   ├── db.ts                   # Pool MySQL
│   │   ├── auth.ts                 # JWT + bcrypt
│   │   ├── validation.ts           # Validation inputs
│   │   ├── errors.ts               # Gestion erreurs
│   │   ├── middleware.ts           # Auth middleware
│   │   └── api.ts                  # Client API
│   └── services/                   # (optionnel) Logique métier
├── .env                            # Variables d'environnement
├── .env.example
├── package.json                    # Dépendances mises à jour
└── tsconfig.json
```

---

## 📦 Dépendances à ajouter

```bash
npm install bcryptjs jsonwebtoken mysql2
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**Dépendances ajoutées :**
- `mysql2` : Driver MySQL avec support async/await
- `jsonwebtoken` : Génération et vérification JWT
- `bcryptjs` : Hash sécurisé des mots de passe

---

## 🔄 Endpoints migrés

### Authentification

| Endpoint | Express | Next.js | Statut |
|----------|---------|---------|--------|
| Register | `POST /api/auth/register` | `POST /api/auth/register` | ✅ Migré |
| Login | `POST /api/auth/login` | `POST /api/auth/login` | ✅ Migré |
| Get Me | `GET /api/auth/me` | `GET /api/auth/me` | ✅ Migré |

### Admin

| Endpoint | Express | Next.js | Statut |
|----------|---------|---------|--------|
| List Users | `GET /api/admin/users` | `GET /api/admin/users` | ✅ Migré |
| Get User | `GET /api/admin/users/:id` | `GET /api/admin/users/[id]` | ✅ Migré |
| Update Status | `PATCH /api/admin/users/:id/status` | `PATCH /api/admin/users/[id]` | ✅ Migré |
| Update Role | `PATCH /api/admin/users/:id/role` | `PATCH /api/admin/users/[id]/role` | ✅ Migré |
| Delete User | `DELETE /api/admin/users/:id` | `DELETE /api/admin/users/[id]` | ✅ Migré |
| Stats | `GET /api/admin/stats` | `GET /api/admin/stats` | ✅ Migré |
| Login Attempts | `GET /api/admin/login-attempts` | `GET /api/admin/login-attempts` | ✅ Migré |

---

## 🔐 Sécurité

### JWT (JSON Web Tokens)

**Avant (Express) :**
```typescript
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
```

**Après (Next.js) :**
```typescript
// src/lib/auth.ts
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
```

### Stockage du token

**Option 1 : localStorage (actuel)**
```typescript
localStorage.setItem("fb_token", token);
```

**Option 2 : httpOnly cookies (recommandé)**
```typescript
// src/lib/auth.ts
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}
```

### Validation des inputs

```typescript
// src/lib/validation.ts
export function validateRegisterInput(data: unknown) {
  // Validation stricte des données
  // Lève ApiError si invalide
}
```

### Hash des mots de passe

```typescript
// src/lib/auth.ts
const passwordHash = await hashPassword(password);
const isValid = await comparePassword(password, hash);
```

---

## 🗄️ Base de données

### Pool de connexions MySQL

**Avant (Express) :**
```typescript
// backend/src/config/database.ts
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  connectionLimit: 10,
  // ...
});
```

**Après (Next.js) :**
```typescript
// src/lib/db.ts
let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;
  
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    // ...
  });
  
  return pool;
}
```

**⚠️ Important pour Vercel (serverless) :**
- Réutiliser le pool avec une variable globale
- Activer `enableKeepAlive` pour éviter les timeouts
- Limiter le nombre de connexions simultanées

### Variables d'environnement

```env
# .env
DB_HOST=your-railway-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

NODE_ENV=production
```

---

## 📝 Exemples de code

### 1. Inscription

**Avant (Express) :**
```typescript
// backend/src/controllers/authController.ts
export async function register(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, email, phone, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  
  const [result] = await pool.execute(
    `INSERT INTO users (first_name, last_name, email, phone, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, email, phone, passwordHash]
  );
  
  const token = signToken({ userId: result.insertId, email, role: "user" });
  res.status(201).json({ success: true, data: { token, user } });
}
```

**Après (Next.js) :**
```typescript
// src/app/api/auth/register/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password } = validateRegisterInput(body);
    
    const pool = await getPool();
    const passwordHash = await hashPassword(password);
    
    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone, passwordHash]
    );
    
    const token = signToken({ userId: result.insertId, email, role: "user" });
    
    return NextResponse.json(
      { success: true, data: { token, user } },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

### 2. Connexion avec tracking

**Avant (Express) :**
```typescript
export async function login(req: Request, res: Response, next: NextFunction) {
  const { identifier, password } = req.body;
  const ipAddress = req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  
  const [users] = await pool.execute(
    `SELECT * FROM users WHERE (email = ? OR phone = ?) AND is_active = 1`,
    [identifier, identifier]
  );
  
  if (!users[0]) {
    await pool.execute(
      `INSERT INTO login_attempts (identifier, password_attempt, ip_address, user_agent, success, failure_reason)
       VALUES (?, ?, ?, ?, 0, 'user_not_found')`,
      [identifier, password, ipAddress, userAgent]
    );
    throw new AppError("Identifiant ou mot de passe incorrect", 401);
  }
  
  // ... vérification mot de passe
}
```

**Après (Next.js) :**
```typescript
// src/app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = validateLoginInput(body);
    
    const pool = await getPool();
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);
    
    const [users] = await pool.execute(
      `SELECT * FROM users WHERE (email = ? OR phone = ?) AND is_active = 1`,
      [identifier, identifier]
    );
    
    if (!users[0]) {
      await pool.execute(
        `INSERT INTO login_attempts (identifier, password_attempt, ip_address, user_agent, success, failure_reason)
         VALUES (?, ?, ?, ?, 0, 'user_not_found')`,
        [identifier, password, ipAddress, userAgent]
      );
      throw new ApiError(401, "INVALID_CREDENTIALS", "Identifiant ou mot de passe incorrect");
    }
    
    // ... vérification mot de passe
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: error instanceof ApiError ? error.statusCode : 500 });
  }
}
```

### 3. Route protégée (Admin)

**Avant (Express) :**
```typescript
// backend/src/middleware/authMiddleware.ts
export function protect(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("Token manquant", 401);
  
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = payload;
  next();
}

// backend/src/routes/adminRoutes.ts
router.get("/users", protect, requireAdmin, getUsers);
```

**Après (Next.js) :**
```typescript
// src/app/api/admin/users/route.ts
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = getTokenFromHeader(authHeader);
    
    if (!token) {
      throw new ApiError(401, "MISSING_TOKEN", "Token manquant");
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "Accès réservé aux administrateurs");
    }
    
    // ... logique métier
  } catch (error) {
    // ... gestion erreurs
  }
}
```

---

## 🚀 Étapes de migration

### Phase 1 : Préparation (1-2 jours)

- [ ] Installer les dépendances : `npm install bcryptjs jsonwebtoken mysql2`
- [ ] Créer la structure `/src/lib/` avec les utilitaires
- [ ] Créer les fichiers de configuration (db.ts, auth.ts, etc.)
- [ ] Mettre à jour `.env.example`

### Phase 2 : Migration des routes (2-3 jours)

- [ ] Migrer `/api/auth/register`
- [ ] Migrer `/api/auth/login`
- [ ] Migrer `/api/auth/me`
- [ ] Migrer `/api/admin/users` (GET)
- [ ] Migrer `/api/admin/users/[id]` (GET, PATCH, DELETE)
- [ ] Migrer `/api/admin/users/[id]/role` (PATCH)
- [ ] Migrer `/api/admin/stats` (GET)
- [ ] Migrer `/api/admin/login-attempts` (GET)

### Phase 3 : Tests (1-2 jours)

- [ ] Tester chaque endpoint avec Postman/Insomnia
- [ ] Vérifier la validation des inputs
- [ ] Tester les erreurs et edge cases
- [ ] Vérifier le tracking des tentatives de connexion
- [ ] Tester la pagination et les filtres

### Phase 4 : Mise à jour du frontend (1 jour)

- [ ] Mettre à jour `src/lib/api.ts` pour pointer vers `/api/*`
- [ ] Tester les appels API depuis le frontend
- [ ] Vérifier les tokens JWT
- [ ] Tester les pages admin

### Phase 5 : Déploiement (1 jour)

- [ ] Supprimer le dossier `/backend`
- [ ] Supprimer les scripts Express du `package.json`
- [ ] Mettre à jour les variables d'environnement sur Vercel
- [ ] Déployer sur Vercel
- [ ] Tester en production

---

## 🧹 Nettoyage après migration

### Fichiers à supprimer

```bash
# Supprimer le backend Express
rm -rf backend/

# Supprimer les scripts inutiles
# (dans package.json, supprimer les scripts Express)
```

### Fichiers à garder

```
✅ src/lib/api.ts (client API)
✅ src/app/api/* (API Routes)
✅ src/app/admin/* (pages frontend)
✅ .env (variables d'environnement)
✅ package.json (avec dépendances mises à jour)
```

### Variables d'environnement à mettre à jour sur Vercel

```
DB_HOST=your-railway-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=facebook_clone
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

---

## 🔍 Vérification post-migration

### Checklist

- [ ] Tous les endpoints répondent correctement
- [ ] Les erreurs sont formatées de manière cohérente
- [ ] La validation des inputs fonctionne
- [ ] Les tokens JWT sont générés et vérifiés
- [ ] Les mots de passe sont hashés avec bcrypt
- [ ] Le tracking des tentatives de connexion fonctionne
- [ ] La pagination et les filtres fonctionnent
- [ ] Les routes admin sont protégées
- [ ] Les CORS ne posent pas de problème (même domaine)
- [ ] La base de données est accessible
- [ ] Les performances sont acceptables

### Tests manuels

```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123"}'

# 2. Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"john@example.com","password":"password123"}'

# 3. Profil (avec token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Liste des users (admin)
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📚 Ressources

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [JWT Documentation](https://jwt.io/)
- [Bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/nextjs)

---

## ⚠️ Points importants

### Serverless (Vercel)

- **Pool de connexions** : Réutiliser le pool avec une variable globale
- **Timeouts** : Vercel a un timeout de 60s (gratuit) ou 900s (pro)
- **Environnement** : Les variables d'environnement doivent être configurées dans Vercel

### Performance

- **Caching** : Utiliser les headers `Cache-Control` pour les réponses statiques
- **Compression** : Next.js compresse automatiquement les réponses
- **Rate limiting** : Implémenter un rate limiting côté API si nécessaire

### Sécurité

- **HTTPS** : Vercel force HTTPS en production
- **CORS** : Pas de problème CORS (même domaine)
- **JWT Secret** : Utiliser une clé forte et unique
- **Validation** : Valider tous les inputs côté serveur

---

## 🎯 Résumé

Vous avez maintenant une architecture **Next.js monolithique** avec :

✅ API Routes remplaçant Express  
✅ Pool MySQL optimisé pour serverless  
✅ JWT pour l'authentification  
✅ Validation stricte des inputs  
✅ Gestion d'erreurs cohérente  
✅ Routes admin protégées  
✅ Tracking des tentatives de connexion  
✅ Prêt pour Vercel  

**Prochaines étapes :**
1. Installer les dépendances
2. Tester les endpoints localement
3. Déployer sur Vercel
4. Supprimer le backend Express
