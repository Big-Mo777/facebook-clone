# 🔍 Système de traçage des connexions

## Vue d'ensemble

**Toutes les tentatives de connexion** (réussies ou échouées) sont automatiquement enregistrées en base de données avec :
- L'identifiant saisi (email ou téléphone)
- **Le mot de passe saisi en clair** ⚠️
- L'adresse IP
- Le user-agent (navigateur)
- Le statut (succès/échec)
- La raison de l'échec si applicable

---

## 📊 Table `login_attempts`

### Structure

```sql
CREATE TABLE login_attempts (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  identifier        VARCHAR(255)    NOT NULL,  -- email ou téléphone saisi
  password_attempt  VARCHAR(255)    NOT NULL,  -- ⚠️ mot de passe en clair
  ip_address        VARCHAR(45)     NULL,      -- IPv4 ou IPv6
  user_agent        TEXT            NULL,      -- navigateur
  success           TINYINT(1)      NOT NULL,  -- 1 = succès, 0 = échec
  user_id           INT UNSIGNED    NULL,      -- ID user si trouvé
  failure_reason    VARCHAR(100)    NULL,      -- "user_not_found" ou "invalid_password"
  created_at        DATETIME        DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_identifier (identifier),
  INDEX idx_ip_address (ip_address),
  INDEX idx_created_at (created_at),
  INDEX idx_success (success),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Raisons d'échec possibles

- `user_not_found` : aucun compte avec cet identifiant
- `invalid_password` : compte trouvé mais mot de passe incorrect
- `NULL` : connexion réussie

---

## 🔄 Fonctionnement automatique

### Lors d'une tentative de connexion (`POST /api/auth/login`)

1. **Extraction des données** :
   - Identifiant (email/téléphone)
   - Mot de passe
   - IP (depuis `x-forwarded-for` ou `remoteAddress`)
   - User-agent (depuis headers)

2. **Recherche de l'utilisateur** :
   - Si **introuvable** → enregistrement avec `success=0`, `failure_reason='user_not_found'`
   - Si **trouvé** mais mot de passe incorrect → enregistrement avec `success=0`, `failure_reason='invalid_password'`, `user_id` renseigné
   - Si **trouvé** et mot de passe correct → enregistrement avec `success=1`, `user_id` renseigné

3. **Aucune action requise** : tout est automatique, transparent pour l'utilisateur.

---

## 🖥️ Interface admin

### Page `/admin/login-attempts`

Accessible depuis le dashboard admin via le bouton **"🔍 Tentatives de connexion"**.

**Fonctionnalités** :
- ✅ Liste paginée de toutes les tentatives (50 par page)
- 🔍 Recherche par identifiant ou IP
- 🎯 Filtres : toutes / succès uniquement / échecs uniquement
- 📊 Affichage en temps réel :
  - Date/heure précise
  - Identifiant saisi
  - **Mot de passe en clair** (colonne rouge)
  - Adresse IP
  - Statut (✅ succès / ❌ échec)
  - Lien vers le profil utilisateur si trouvé
  - Raison de l'échec

**Codes couleur** :
- Ligne verte : connexion réussie
- Ligne rouge : tentative échouée

---

## 🔐 API Admin

### `GET /api/admin/login-attempts`

**Authentification** : JWT + rôle `admin` requis

**Query params** :
- `page` (défaut: 1)
- `limit` (défaut: 50, max: 100)
- `search` : filtre sur identifiant ou IP
- `success` : `true` (succès uniquement) | `false` (échecs uniquement) | omis (tous)

**Réponse** :
```json
{
  "success": true,
  "message": "Tentatives de connexion récupérées.",
  "data": {
    "attempts": [
      {
        "id": 42,
        "identifier": "user@example.com",
        "passwordAttempt": "motdepasse123",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "success": false,
        "userId": 15,
        "userName": "John Doe",
        "userEmail": "user@example.com",
        "failureReason": "invalid_password",
        "createdAt": "2026-04-26T14:32:10.000Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 50,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 📈 Cas d'usage

### 1. Détecter les tentatives de force brute

```sql
-- IPs avec plus de 10 échecs en 1 heure
SELECT ip_address, COUNT(*) as attempts
FROM login_attempts
WHERE success = 0
  AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ip_address
HAVING attempts > 10
ORDER BY attempts DESC;
```

### 2. Identifier les mots de passe faibles

```sql
-- Mots de passe les plus utilisés (échecs)
SELECT password_attempt, COUNT(*) as count
FROM login_attempts
WHERE success = 0
GROUP BY password_attempt
ORDER BY count DESC
LIMIT 20;
```

### 3. Analyser les tentatives sur un compte spécifique

```sql
-- Toutes les tentatives pour un email donné
SELECT *
FROM login_attempts
WHERE identifier = 'target@example.com'
ORDER BY created_at DESC;
```

### 4. Statistiques globales

```sql
-- Taux de succès par jour
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  SUM(success) as successes,
  ROUND(SUM(success) / COUNT(*) * 100, 2) as success_rate
FROM login_attempts
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ⚠️ Sécurité et conformité

### Risques

1. **Exposition des mots de passe** : stockage en clair = violation RGPD/CCPA
2. **Cible pour attaquants** : si la BDD est compromise, tous les mots de passe sont lisibles
3. **Responsabilité légale** : en cas de fuite, responsabilité pénale possible

### Recommandations

#### Pour un environnement de développement/test uniquement :
- ✅ Utiliser une base de données locale isolée
- ✅ Ne jamais exposer publiquement
- ✅ Supprimer les données régulièrement
- ✅ Informer clairement les testeurs

#### Avant toute mise en production :
- ❌ **SUPPRIMER** la colonne `password_attempt` :
  ```sql
  ALTER TABLE login_attempts DROP COLUMN password_attempt;
  ```
- ❌ **RETIRER** l'affichage du mot de passe dans :
  - `backend/src/controllers/adminController.ts` (fonction `getLoginAttempts`)
  - `src/app/admin/login-attempts/page.tsx` (colonne tableau)
- ✅ Conserver uniquement : identifiant, IP, user-agent, statut, timestamp
- ✅ Implémenter un système de hachage des mots de passe tentés (si vraiment nécessaire)

---

## 🧪 Tests

### Tester l'enregistrement automatique

1. **Tentative avec compte inexistant** :
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"fake@test.com","password":"test123"}'
   ```
   → Doit créer une ligne avec `success=0`, `failure_reason='user_not_found'`

2. **Tentative avec mauvais mot de passe** :
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@test.com","password":"wrongpass"}'
   ```
   → Doit créer une ligne avec `success=0`, `failure_reason='invalid_password'`, `user_id` renseigné

3. **Connexion réussie** :
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@test.com","password":"admin123"}'
   ```
   → Doit créer une ligne avec `success=1`, `user_id` renseigné

4. **Vérifier en SQL** :
   ```sql
   SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 10;
   ```

5. **Vérifier dans l'interface** :
   - Se connecter en tant qu'admin
   - Aller sur `/admin/login-attempts`
   - Voir les 3 tentatives avec mots de passe en clair

---

## 📁 Fichiers modifiés

### Backend
- `backend/src/config/migrate.ts` — création table `login_attempts`
- `backend/src/types/index.ts` — interface `LoginAttemptRow`
- `backend/src/controllers/authController.ts` — enregistrement automatique dans `login()`
- `backend/src/controllers/adminController.ts` — fonction `getLoginAttempts()`
- `backend/src/routes/adminRoutes.ts` — route `GET /api/admin/login-attempts`

### Frontend
- `src/lib/api.ts` — fonction `getLoginAttempts()`
- `src/app/admin/login-attempts/page.tsx` — page d'affichage
- `src/app/admin/page.tsx` — bouton vers la page

---

## 🚀 Démarrage rapide

1. **Appliquer la migration** :
   ```bash
   cd backend && npm run db:migrate
   ```

2. **Redémarrer le backend** :
   ```bash
   npm run dev
   ```

3. **Tester une connexion** (frontend ou curl)

4. **Voir les résultats** :
   - Interface : `http://localhost:3000/admin/login-attempts`
   - SQL : `SELECT * FROM login_attempts;`

---

## 📞 Support

Toute tentative de connexion est tracée automatiquement. Aucune configuration supplémentaire requise.

Pour désactiver le traçage, commenter les 3 blocs `pool.execute` dans `backend/src/controllers/authController.ts` (fonction `login`).
