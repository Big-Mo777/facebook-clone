"use client";

import { forwardRef } from "react";

/**
 * InputField — Champ de saisie réutilisable
 * Supporte : texte, email, password, tel
 * Accessibilité : label associé, aria-describedby pour les erreurs
 */

interface InputFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      type = "text",
      value,
      onChange,
      placeholder,
      error,
      autoComplete,
      disabled = false,
    },
    ref
  ) => {
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1 w-full">
        {/* Label accessible mais visuellement masqué (placeholder fait office de label) */}
        <label htmlFor={id} className="sr-only">
          {label}
        </label>

        <input
          ref={ref}
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            // Base styles
            "w-full px-4 py-3 rounded-lg text-base",
            "border transition-all duration-200 outline-none",
            "placeholder:text-gray-400",
            // Animation focus
            "input-focus-animation",
            // État normal
            !error
              ? "border-gray-300 bg-white focus:border-[#1877f2] dark:bg-[#3a3b3c] dark:border-[#3a3b3c] dark:text-[#e4e6eb] dark:placeholder:text-gray-500 dark:focus:border-[#2d88ff]"
              : // État erreur
                "border-red-500 bg-red-50 focus:border-red-500 dark:bg-[#3a3b3c] dark:border-red-500",
            // État désactivé
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-text",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {/* Message d'erreur */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
