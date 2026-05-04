# 🎨 Intégration Frontend - Utilisation des API Routes

Ce document explique comment utiliser les API Routes migrées depuis le frontend Next.js.

---

## 📦 Client API

Le fichier `src/lib/api.ts` centralise tous les appels API. Il pointe maintenant vers les API Routes Next.js.

```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
```

---

## 🔐 Authentification

### 1. Inscription

```typescript
import { registerUser } from "@/lib/api";

async function handleRegister() {
  try {
    const response = await registerUser({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
    });

    if (response.success) {
      console.log("✅ Inscription réussie");
      console.log("Token:", response.data?.token);
      console.log("User:", response.data?.user);
      // Rediriger vers le dashboard
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 2. Connexion

```typescript
import { loginUser } from "@/lib/api";

async function handleLogin() {
  try {
    const response = await loginUser("john@example.com", "password123");

    if (response.success) {
      console.log("✅ Connexion réussie");
      console.log("Token:", response.data?.token);
      // Rediriger vers le dashboard
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 3. Récupérer le profil

```typescript
import { getMe } from "@/lib/api";

async function handleGetProfile() {
  try {
    const response = await getMe();

    if (response.success) {
      console.log("✅ Profil récupéré");
      console.log("User:", response.data?.user);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

---

## 👥 Gestion des utilisateurs (Admin)

### 1. Lister les utilisateurs

```typescript
import { getAdminUsers } from "@/lib/api";

async function handleListUsers() {
  try {
    const response = await getAdminUsers({
      page: 1,
      limit: 20,
      search: "john",
      role: "user",
      isActive: true,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    if (response.success) {
      console.log("✅ Utilisateurs récupérés");
      console.log("Users:", response.data?.users);
      console.log("Pagination:", response.data?.pagination);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 2. Récupérer un utilisateur

```typescript
import { getAdminUser } from "@/lib/api";

async function handleGetUser(userId: number) {
  try {
    const response = await getAdminUser(userId);

    if (response.success) {
      console.log("✅ Utilisateur récupéré");
      console.log("User:", response.data?.user);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 3. Activer/Désactiver un utilisateur

```typescript
import { updateUserStatus } from "@/lib/api";

async function handleToggleUserStatus(userId: number, isActive: boolean) {
  try {
    const response = await updateUserStatus(userId, isActive);

    if (response.success) {
      console.log("✅ Statut mis à jour");
      console.log("Message:", response.message);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 4. Changer le rôle d'un utilisateur

```typescript
import { updateUserRole } from "@/lib/api";

async function handleChangeUserRole(userId: number, role: "user" | "admin") {
  try {
    const response = await updateUserRole(userId, role);

    if (response.success) {
      console.log("✅ Rôle mis à jour");
      console.log("Message:", response.message);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

### 5. Supprimer un utilisateur

```typescript
import { deleteUser } from "@/lib/api";

async function handleDeleteUser(userId: number) {
  try {
    const response = await deleteUser(userId);

    if (response.success) {
      console.log("✅ Utilisateur supprimé");
      console.log("Message:", response.message);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

---

## 📊 Statistiques (Admin)

```typescript
import { getAdminStats } from "@/lib/api";

async function handleGetStats() {
  try {
    const response = await getAdminStats();

    if (response.success) {
      console.log("✅ Statistiques récupérées");
      const stats = response.data?.stats;
      console.log("Total users:", stats?.total);
      console.log("Active users:", stats?.active);
      console.log("Admins:", stats?.admins);
      console.log("New today:", stats?.newToday);
    } else {
      console.error("❌ Erreur:", response.message);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

---

## 🔍 Tentatives de connexion (Admin)

```typescript
import { getLoginAttempts } from "@/lib/api";

async function handleGetLoginAttempts() {
  try {
    // Mode normal : toutes les tentatives
    const response = await getLoginAttempts({
      page: 1,
      limit: 50,
      search: "john@example.com",
      success: true, // ou false, ou undefined pour tous
    });

    if (response.success) {
      console.log("✅ Tentatives récupérées");
      console.log("Attempts:", response.data?.attempts);
      console.log("Pagination:", response.data?.pagination);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}

async function handleGetUniqueLoginAttempts() {
  try {
    // Mode unique : une seule tentative par identifiant (la plus récente)
    const response = await getLoginAttempts({
      page: 1,
      limit: 50,
      unique: true,
    });

    if (response.success) {
      console.log("✅ Tentatives uniques récupérées");
      console.log("Attempts:", response.data?.attempts);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

---

## 🎯 Exemple complet : Page de connexion

```typescript
// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(identifier, password);

      if (response.success) {
        // Rediriger vers le dashboard
        router.push("/admin");
      } else {
        setError(response.message || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email ou téléphone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
```

---

## 🎯 Exemple complet : Page admin (Liste des utilisateurs)

```typescript
// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, updateUserStatus, deleteUser } from "@/lib/api";
import type { AdminUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await getAdminUsers({
        page,
        limit: 20,
        search: search || undefined,
      });

      if (response.success) {
        setUsers(response.data?.users || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId: number, isActive: boolean) {
    try {
      await updateUserStatus(userId, !isActive);
      loadUsers(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  async function handleDelete(userId: number) {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      await deleteUser(userId);
      loadUsers(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des utilisateurs</h1>

      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full px-4 py-2 border rounded mb-6"
      />

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Nom</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Rôle</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border">
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.firstName} {user.lastName}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                    className={`px-3 py-1 rounded text-white ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {user.isActive ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-4 py-2">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
```

---

## 🔄 Gestion des tokens

### Stockage du token

Le token est automatiquement sauvegardé dans `localStorage` :

```typescript
// src/lib/api.ts
export function setToken(token: string): void {
  localStorage.setItem("fb_token", token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fb_token");
}

export function removeToken(): void {
  localStorage.removeItem("fb_token");
}
```

### Déconnexion

```typescript
import { removeToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  return (
    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">
      Déconnexion
    </button>
  );
}
```

---

## ⚠️ Gestion des erreurs

Tous les appels API retournent une structure cohérente :

```typescript
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  code?: string;
}
```

Exemple de gestion d'erreur :

```typescript
try {
  const response = await loginUser(email, password);

  if (!response.success) {
    // Erreur métier (validation, authentification, etc.)
    console.error("Erreur:", response.message);
    console.error("Code:", response.code);
  } else {
    // Succès
    console.log("Données:", response.data);
  }
} catch (error) {
  // Erreur réseau
  console.error("Erreur réseau:", error);
}
```

---

## 🚀 Déploiement

Une fois que tout fonctionne localement :

1. **Mettre à jour `NEXT_PUBLIC_API_URL` sur Vercel**
   ```
   NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
   ```

2. **Déployer**
   ```bash
   git push
   ```

3. **Vérifier en production**
   - Tester la connexion
   - Vérifier les appels API dans les DevTools
   - Vérifier les logs Vercel

---

## 📚 Ressources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JWT](https://jwt.io/)
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## ✅ Checklist d'intégration

- [ ] Les appels API pointent vers `/api/*`
- [ ] Les tokens sont sauvegardés et envoyés dans les headers
- [ ] Les erreurs sont gérées correctement
- [ ] Les pages admin sont protégées
- [ ] La déconnexion fonctionne
- [ ] Les formulaires valident les inputs
- [ ] Les appels API fonctionnent en production

**Vous êtes prêt à utiliser les API Routes ! 🎉**
