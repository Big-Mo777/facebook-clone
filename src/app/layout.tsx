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
         * Applique la classe .dark sur <html> immédiatement pour éviter
         * le flash blanc quand la préférence sauvegardée est "dark".
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
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
