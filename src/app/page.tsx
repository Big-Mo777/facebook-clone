import FacebookLogo from "@/components/FacebookLogo";
import LoginForm from "@/components/LoginForm";
import DarkModeToggle from "@/components/DarkModeToggle";

/**
 * Page de connexion Facebook Lite
 * Design mobile-first, centré verticalement et horizontalement
 * Supporte le mode sombre via la classe .dark sur <html>
 */
export default function LoginPage() {
  return (
    // Fond gris clair (style Facebook) — dark: fond très sombre
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#f0f2f5] dark:bg-[#18191a] transition-colors duration-300"
      aria-label="Page de connexion Facebook"
    >
      {/* Bouton dark mode (coin supérieur droit) */}
      <DarkModeToggle />

      {/* Carte de connexion */}
      <div
        className={[
          "w-full max-w-sm",
          "bg-white dark:bg-[#242526]",
          "rounded-2xl shadow-lg dark:shadow-black/40",
          "px-6 py-8",
          "flex flex-col items-center",
          "transition-colors duration-300",
        ].join(" ")}
        role="region"
        aria-label="Formulaire de connexion"
      >
        {/* Logo Facebook */}
        <FacebookLogo />

        {/* Tagline */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6 leading-snug">
          Facebook vous aide à communiquer et à partager avec les personnes qui
          comptent dans votre vie.
        </p>

        {/* Formulaire de connexion */}
        <LoginForm />
      </div>

      {/* Footer liens légaux */}
      <footer className="mt-8 text-center" aria-label="Liens légaux Facebook">
        <nav
          className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mb-2"
          aria-label="Liens de navigation secondaires"
        >
          {[
            "Français (France)",
            "English (UK)",
            "Español",
            "Português",
            "Deutsch",
          ].map((lang) => (
            <a
              key={lang}
              href="#"
              className="hover:underline transition-colors"
              aria-label={`Changer la langue en ${lang}`}
            >
              {lang}
            </a>
          ))}
        </nav>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
          {[
            "Inscription",
            "Connexion",
            "Messenger",
            "Facebook Lite",
            "Vidéo",
            "Lieux",
            "Jeux",
            "Marketplace",
            "Meta Pay",
            "Meta Store",
            "Meta Quest",
            "Instagram",
            "Threads",
            "Actes de vote",
            "Confidentialité",
            "Centre de confidentialité",
            "Groupes",
            "À propos",
            "Créer une pub",
            "Créer une Page",
            "Développeurs",
            "Carrières",
            "Cookies",
            "Conditions générales",
            "Aide",
          ].map((link) => (
            <a
              key={link}
              href="#"
              className="hover:underline transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
          Meta © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
