import FacebookLogo from "@/components/FacebookLogo";
import LoginForm from "@/components/LoginForm";
import DarkModeToggle from "@/components/DarkModeToggle";

/**
 * Page de connexion Facebook - Copie conforme
 * Reproduit exactement l'interface de connexion Facebook
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
      {/* Bouton dark mode */}
      <DarkModeToggle />
      
      {/* Container principal avec layout Facebook exact */}
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[980px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-16">
          
          {/* Section gauche - Branding Facebook */}
          <div className="flex-1 text-center lg:text-left lg:pr-8">
            <div className="mb-4">
              <FacebookLogo />
            </div>
            <h2 className="text-[28px] leading-[32px] font-normal text-[#1c1e21] dark:text-[#e4e6eb] max-w-[500px] mx-auto lg:mx-0">
              Facebook vous aide à communiquer et à partager avec les personnes qui comptent dans votre vie.
            </h2>
          </div>

          {/* Section droite - Formulaire de connexion */}
          <div className="flex-shrink-0 w-full lg:w-[396px]">
            <div className="bg-white dark:bg-[#242526] rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.3)] p-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Facebook */}
      <footer className="bg-white dark:bg-[#242526] border-t border-gray-200 dark:border-gray-700 py-8 px-4">
        <div className="max-w-[980px] mx-auto">
          {/* Langues */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {[
              "Français (France)",
              "English (US)",
              "Español",
              "Português (Brasil)",
              "Deutsch",
              "العربية",
              "हिन्दी",
              "中文(简体)",
              "日本語",
              "한국어",
              "Italiano"
            ].map((lang, index) => (
              <a
                key={lang}
                href="#"
                className={`hover:underline ${index === 0 ? 'font-semibold' : ''}`}
              >
                {lang}
              </a>
            ))}
            <button className="text-gray-500 dark:text-gray-400 hover:underline border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs">
              +
            </button>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-700 mb-4" />
          
          {/* Liens */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
            {[
              "S'inscrire",
              "Se connecter",
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
              "Collectes de dons",
              "Services",
              "Centre d'informations sur les élections",
              "Politique de confidentialité",
              "Centre de confidentialité",
              "Groupes",
              "À propos",
              "Créer une publicité",
              "Créer une Page",
              "Développeurs",
              "Carrières",
              "Cookies",
              "Conditions générales",
              "Aide",
              "Paramètres"
            ].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:underline"
              >
                {link}
              </a>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Meta © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
}
