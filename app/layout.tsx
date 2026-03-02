import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { cookies } from 'next/headers'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#121213',
}

export const metadata: Metadata = {
  title: 'Wordle en Español',
  description: 'Adivina la palabra de 5 letras en 6 intentos. Juego tipo Wordle completamente en español.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const theme = (await cookies()).get("theme")?.value as "light" | "dark" | "system" | undefined;

  const serverClass =
    theme === "dark"
      ? "dark"
      : theme === "light"
        ? ""
        : "";

  const themeBootScript = `
  (function () {
    try {
      var raw = localStorage.getItem('wordle-settings');
      var s = raw ? JSON.parse(raw) : null;
      var theme = (s && s.theme) ? s.theme : '${theme ?? "system"}';
      var isDark = theme === 'dark' ? true :
                    theme === 'light' ? false :
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}
  })();
  `;

  return (
    <html lang="es" className={serverClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
