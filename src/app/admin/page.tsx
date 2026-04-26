"use client";

import { useEffect, useState } from "react";
import { getAdminStats, getAdminUsers, type AdminUser, type AdminUsersResponse } from "@/lib/api";
import { useRouter } from "next/navigation";

/**
 * Page admin — Dashboard avec stats + liste des utilisateurs
 * Accessible uniquement aux admins authentifiés
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
    newToday: number;
    newLast7Days: number;
    newLast30Days: number;
  } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les stats au montage
  useEffect(() => {
    loadStats();
  }, []);

  // Charger les users quand les filtres changent
  useEffect(() => {
    loadUsers();
  }, [pagination.page, search, roleFilter, statusFilter]);

  async function loadStats() {
    try {
      const res = await getAdminStats();
      if (res.success && res.data) {
        setStats(res.data.stats);
      } else {
        setError("Accès refusé. Vous devez être admin.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res: AdminUsersResponse = await getAdminUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      });

      if (res.success && res.data) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else {
        setError("Impossible de charger les utilisateurs.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 })); // reset à la page 1
    loadUsers();
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#18191a]">
        <div className="bg-white dark:bg-[#242526] p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5]"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#18191a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🛡️ Administration
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin/login-attempts")}
              className="px-4 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5]"
            >
              🔍 Tentatives de connexion
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-200 dark:bg-[#3a3b3c] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#4a4b4c]"
            >
              Retour
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total utilisateurs" value={stats.total} color="blue" />
            <StatCard title="Actifs" value={stats.active} color="green" />
            <StatCard title="Inactifs" value={stats.inactive} color="red" />
            <StatCard title="Admins" value={stats.admins} color="purple" />
            <StatCard title="Nouveaux aujourd'hui" value={stats.newToday} color="yellow" />
            <StatCard title="7 derniers jours" value={stats.newLast7Days} color="indigo" />
            <StatCard title="30 derniers jours" value={stats.newLast30Days} color="pink" />
            <StatCard title="Users" value={stats.users} color="teal" />
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-[#242526] p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Rechercher (nom, email, téléphone)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#3a3b3c] rounded-lg bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="px-4 py-2 border border-gray-300 dark:border-[#3a3b3c] rounded-lg bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 dark:border-[#3a3b3c] rounded-lg bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5]"
            >
              Rechercher
            </button>
          </form>
        </div>

        {/* Table des utilisateurs */}
        <div className="bg-white dark:bg-[#242526] rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#3a3b3c]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Téléphone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">⚠️ Mot de passe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Créé le</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#3a3b3c]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#3a3b3c]">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.phone || "-"}</td>
                        <td className="px-6 py-4 text-sm font-mono text-red-600 dark:text-red-400">
                          {user.password}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {user.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-[#1877f2] hover:underline"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#3a3b3c] flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} utilisateurs)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!pagination.hasPrev}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-4 py-2 bg-white dark:bg-[#242526] border border-gray-300 dark:border-[#3a3b3c] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#3a3b3c]"
                  >
                    Précédent
                  </button>
                  <button
                    disabled={!pagination.hasNext}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-4 py-2 bg-white dark:bg-[#242526] border border-gray-300 dark:border-[#3a3b3c] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#3a3b3c]"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant carte de statistique
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
    teal: "bg-teal-500",
  };

  return (
    <div className="bg-white dark:bg-[#242526] p-6 rounded-lg shadow">
      <div className={`w-12 h-12 ${colors[color]} rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold`}>
        {value}
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
