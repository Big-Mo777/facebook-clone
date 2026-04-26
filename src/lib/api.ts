/**
 * Client API — centralise tous les appels vers le backend Node.js
 * Utilise fetch natif (disponible dans Next.js 13+)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role?: "user" | "admin";
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
  errors?: { field: string; message: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Récupère le token JWT depuis localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fb_token");
}

/** Sauvegarde le token JWT */
export function setToken(token: string): void {
  localStorage.setItem("fb_token", token);
}

/** Supprime le token (déconnexion) */
export function removeToken(): void {
  localStorage.removeItem("fb_token");
}

// ─── Appels API ──────────────────────────────────────────────────────────────

/**
 * Connexion utilisateur
 * POST /api/auth/login
 */
export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data: AuthResponse = await res.json();

  // Sauvegarder le token si connexion réussie
  if (data.success && data.data?.token) {
    setToken(data.data.token);
  }

  return data;
}

/**
 * Inscription utilisateur
 * POST /api/auth/register
 */
export async function registerUser(payload: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: AuthResponse = await res.json();

  if (data.success && data.data?.token) {
    setToken(data.data.token);
  }

  return data;
}

/**
 * Récupère le profil de l'utilisateur connecté
 * GET /api/auth/me
 */
export async function getMe(): Promise<{ success: boolean; data?: { user: User }; message: string }> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}


// ─── Types Admin ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  isActive: boolean;
  password: string; // ⚠️ mot de passe en clair (dev uniquement)
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  message: string;
  data?: {
    users: AdminUser[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface AdminStatsResponse {
  success: boolean;
  message: string;
  data?: {
    stats: {
      total: number;
      active: number;
      inactive: number;
      admins: number;
      users: number;
      newToday: number;
      newLast7Days: number;
      newLast30Days: number;
    };
  };
}

// ─── Appels API Admin ────────────────────────────────────────────────────────

/**
 * Récupère les statistiques du dashboard admin
 * GET /api/admin/stats
 */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

/**
 * Liste paginée des utilisateurs avec recherche et filtres
 * GET /api/admin/users
 */
export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: "user" | "admin";
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<AdminUsersResponse> {
  const token = getToken();
  const query = new URLSearchParams();
  
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.isActive !== undefined) query.set("isActive", params.isActive.toString());
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

  const res = await fetch(`${API_URL}/api/admin/users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

/**
 * Détail d'un utilisateur
 * GET /api/admin/users/:id
 */
export async function getAdminUser(id: number): Promise<{
  success: boolean;
  message: string;
  data?: { user: AdminUser };
}> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

/**
 * Active ou désactive un compte
 * PATCH /api/admin/users/:id/status
 */
export async function updateUserStatus(id: number, isActive: boolean): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });
  return res.json();
}

/**
 * Change le rôle d'un utilisateur
 * PATCH /api/admin/users/:id/role
 */
export async function updateUserRole(id: number, role: "user" | "admin"): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  return res.json();
}

/**
 * Supprime définitivement un utilisateur
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(id: number): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}


// ─── Types Login Attempts ────────────────────────────────────────────────────

export interface LoginAttempt {
  id: number;
  identifier: string;
  passwordAttempt: string; // ⚠️ mot de passe saisi en clair
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface LoginAttemptsResponse {
  success: boolean;
  message: string;
  data?: {
    attempts: LoginAttempt[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Liste paginée des tentatives de connexion
 * GET /api/admin/login-attempts
 */
export async function getLoginAttempts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  success?: boolean;
}): Promise<LoginAttemptsResponse> {
  const token = getToken();
  const query = new URLSearchParams();

  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.search) query.set("search", params.search);
  if (params?.success !== undefined) query.set("success", params.success.toString());

  const res = await fetch(`${API_URL}/api/admin/login-attempts?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
