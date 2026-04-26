"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLoginAttempts, type LoginAttempt, type LoginAttemptsResponse } from "@/lib/api";

/**
 * Page admin — Historique de toutes les tentatives de connexion
 * Affiche les identifiants + mots de passe saisis (succès ET échecs)
 */
export default function LoginAttemptsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttempts();
  }, [pagination.page, statusFilter]);

  async function loadAttempts() {
    setLoading(true);
    try {
      const res: LoginAttemptsResponse = await getLoginAttempts({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        success: statusFilter === "all" ? undefined : statusFilter === "success",
      });

      if (res.success && res.data) {
        setAttempts(res.data.attempts);
        setPagination(res.data.pagination);
      } else {
        setError("Impossible de charger les tentatives.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAttempts();
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#18191a]">
        <div className="bg-white dark:bg-[#242526] p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="px-6 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5]"
          >
            Retour au dashboard
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🔍 Tentatives de connexion
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Historique complet des connexions (succès + échecs) avec mots de passe en clair
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-200 dark:bg-[#3a3b3c] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#4a4b4c]"
          >
            ← Retour
          </button>
        </div>

        {/* Avertissement */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">⚠️ Données sensibles</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Cette page affiche les mots de passe en clair. Utilisation strictement réservée au développement local.
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-[#242526] p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Rechercher (identifiant, IP)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#3a3b3c] rounded-lg bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 dark:border-[#3a3b3c] rounded-lg bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white"
            >
              <option value="all">Toutes les tentatives</option>
              <option value="success">✅ Succès uniquement</option>
              <option value="failure">❌ Échecs uniquement</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5]"
            >
              Rechercher
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#242526] rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#3a3b3c]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Identifiant saisi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">⚠️ Mot de passe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raison échec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#3a3b3c]">
                    {attempts.map((attempt) => (
                      <tr
                        key={attempt.id}
                        className={`hover:bg-gray-50 dark:hover:bg-[#3a3b3c] ${
                          attempt.success ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{attempt.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(attempt.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {attempt.identifier}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-red-600 dark:text-red-400">
                          {attempt.passwordAttempt}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {attempt.ipAddress || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              attempt.success
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {attempt.success ? "✅ Succès" : "❌ Échec"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {attempt.userName ? (
                            <button
                              onClick={() => router.push(`/admin/users/${attempt.userId}`)}
                              className="text-[#1877f2] hover:underline"
                            >
                              {attempt.userName}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500">
                          {attempt.failureReason === "user_not_found" && "Utilisateur introuvable"}
                          {attempt.failureReason === "invalid_password" && "Mot de passe incorrect"}
                          {!attempt.failureReason && "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#3a3b3c] flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} tentatives)
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
