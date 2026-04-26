"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAdminUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  type AdminUser,
} from "@/lib/api";

/**
 * Page de détail d'un utilisateur — Admin uniquement
 * Permet de voir toutes les infos et effectuer des actions (activer, changer rôle, supprimer)
 */
export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  async function loadUser() {
    setLoading(true);
    try {
      const res = await getAdminUser(userId);
      if (res.success && res.data) {
        setUser(res.data.user);
      } else {
        setError("Utilisateur introuvable.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await updateUserStatus(user.id, !user.isActive);
      if (res.success) {
        alert(res.message);
        loadUser();
      } else {
        alert("Erreur : " + res.message);
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole() {
    if (!user) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`Changer le rôle en "${newRole}" ?`)) return;

    setActionLoading(true);
    try {
      const res = await updateUserRole(user.id, newRole);
      if (res.success) {
        alert(res.message);
        loadUser();
      } else {
        alert("Erreur : " + res.message);
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    if (!confirm(`⚠️ SUPPRIMER DÉFINITIVEMENT ${user.firstName} ${user.lastName} ?`)) return;
    if (!confirm("Cette action est IRRÉVERSIBLE. Confirmer ?")) return;

    setActionLoading(true);
    try {
      const res = await deleteUser(user.id);
      if (res.success) {
        alert(res.message);
        router.push("/admin");
      } else {
        alert("Erreur : " + res.message);
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#18191a]">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !user) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Détail utilisateur #{user.id}
          </h1>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-200 dark:bg-[#3a3b3c] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#4a4b4c]"
          >
            ← Retour
          </button>
        </div>

        {/* Carte principale */}
        <div className="bg-white dark:bg-[#242526] rounded-lg shadow-lg p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="ID" value={user.id.toString()} />
            <InfoField label="Prénom" value={user.firstName} />
            <InfoField label="Nom" value={user.lastName} />
            <InfoField label="Email" value={user.email || "-"} />
            <InfoField label="Téléphone" value={user.phone || "-"} />
            <InfoField
              label="Rôle"
              value={
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {user.role}
                </span>
              }
            />
            <InfoField
              label="Statut"
              value={
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded ${
                    user.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {user.isActive ? "Actif" : "Inactif"}
                </span>
              }
            />
            <InfoField label="Créé le" value={new Date(user.createdAt).toLocaleString("fr-FR")} />
            <InfoField label="Mis à jour le" value={new Date(user.updatedAt).toLocaleString("fr-FR")} />
          </div>

          {/* Section mot de passe — DANGER */}
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              ⚠️ Mot de passe (DEV UNIQUEMENT)
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Cette information ne doit JAMAIS être exposée en production. Utilisez uniquement en développement local.
            </p>
            <div className="bg-white dark:bg-[#242526] p-4 rounded border border-red-300 dark:border-red-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mot de passe en clair :</p>
              <p className="font-mono text-lg font-bold text-red-700 dark:text-red-300 break-all">
                {user.password}
              </p>
            </div>
            <div className="mt-4 bg-white dark:bg-[#242526] p-4 rounded border border-red-300 dark:border-red-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hash bcrypt (tronqué) :</p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500 break-all">
                {user.passwordHash}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-[#242526] rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Actions administrateur</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                user.isActive
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {user.isActive ? "🔒 Désactiver le compte" : "✅ Activer le compte"}
            </button>

            <button
              onClick={handleToggleRole}
              disabled={actionLoading}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user.role === "admin" ? "👤 Rétrograder en User" : "👑 Promouvoir en Admin"}
            </button>

            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant champ d'information
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-base text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
