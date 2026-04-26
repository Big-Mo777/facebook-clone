"use client";

import { useState, useEffect } from "react";

/**
 * DarkModeToggle — Bascule entre mode clair et sombre
 * Tailwind v4 : dark mode basé sur la classe .dark sur <html>
 * Persiste la préférence dans localStorage
 * Respecte la préférence système par défaut
 */
export default function DarkModeToggle() {
  // Initialisation synchrone depuis le DOM pour éviter le flash
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  // Synchronisation au montage (au cas où le script inline a déjà appliqué la classe)
  useEffect(() => {
    const current = document.documentElement.classList.contains("dark");
    setIsDark(current);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    // Ajoute/retire la classe .dark sur <html> → active les variantes Tailwind dark:
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={[
        "fixed top-4 right-4 z-50",
        "w-10 h-10 rounded-full flex items-center justify-center",
        "transition-all duration-200 shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:ring-offset-2",
        isDark
          ? "bg-[#3a3b3c] text-yellow-400 hover:bg-[#4a4b4c]"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200",
      ].join(" ")}
    >
      {isDark ? (
        // Icône soleil (mode sombre actif → cliquer pour passer en clair)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 001.06 1.06l1.59-1.59a.75.75 0 00-1.06-1.061l-1.59 1.59z" />
        </svg>
      ) : (
        // Icône lune (mode clair actif → cliquer pour passer en sombre)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
