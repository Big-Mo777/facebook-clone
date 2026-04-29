"use client";

import { forwardRef } from "react";

/**
 * InputField — Champ de saisie style Facebook
 * Reproduit exactement le style des inputs Facebook
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
    return (
      <div className="w-full">
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
          className={`
            w-full px-4 py-[14px] text-[17px] leading-4
            border border-[#dddfe2] rounded-md
            bg-[#f5f6f7] dark:bg-[#3a3b3c] dark:border-[#3a3b3c]
            text-[#1d2129] dark:text-[#e4e6eb]
            placeholder:text-[#8a8d91] dark:placeholder:text-[#b0b3b8]
            focus:bg-white dark:focus:bg-[#242526]
            focus:border-[#1877f2] focus:outline-none
            transition-all duration-200
            ${error ? 'border-[#fa383e] bg-[#ffebee] dark:bg-[#3a3b3c]' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {error && (
          <div className="text-[#fa383e] text-[13px] mt-1 leading-4">
            {error}
          </div>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
