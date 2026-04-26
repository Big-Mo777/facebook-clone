"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import InputField from "@/components/InputField";

/**
 * Page de connexion ADMIN uniquement
 * Ne redirige PAS vers l'URL externe, permet l'accès au dashboard
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation simple
    if (!values.identifier.trim()) {
      setErrors({ identifier: "Email requis" });
      return;
    }
    if (!values.password) {
      setErrors({ password: "Mot de passe requis" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await loginUser(values.identifier, values.password);

      if (result.success && result.data?.user.role === "admin") {
        // Connexion admin réussie → redirection vers dashboard
        router.push("/admin");
      } else if (result.success && result.data?.user.role !== "admin") {
        setErrors({ general: "Accès refusé. Vous n'êtes pas administrateur." });
      } else {
        setErrors({ general: result.message || "Identifiants incorrects." });
      }
    } catch {
      setErrors({ general: "Erreur de connexion au serveur." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#18191a] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#242526] rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1877f2] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🛡️ Connexion Admin
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            id="identifier"
            label="Email"
            type="email"
            value={values.identifier}
            onChange={(e) => setValues({ ...values, identifier: e.target.value })}
            placeholder="admin@test.com"
            error={errors.identifier}
            autoComplete="username"
          />

          <InputField
            id="password"
            label="Mot de passe"
            type="password"
            value={values.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
            placeholder="Mot de passe"
            error={errors.password}
            autoComplete="current-password"
          />

          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#1877f2] text-white rounded-lg font-semibold hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#1877f2] dark:hover:text-[#2d88ff] transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
