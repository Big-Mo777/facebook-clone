import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facebook - Connexion ou inscription",
  description:
    "Connectez-vous à Facebook pour commencer à partager et communiquer avec vos amis, votre famille et les personnes que vous connaissez.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/*
         * Script inline exécuté AVANT hydratation React.
         * Applique la classe .dark sur <html> immédiatement pour éviter le flash.
         * Écoute les changements du thème système en temps réel.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function applyTheme() {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                  
                  // Applique le thème au chargement
                  applyTheme();
                  
                  // Écoute les changements du thème système
                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
