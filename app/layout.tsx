// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seguimiento de Pacientes",
  description: "Sistema simple de seguimiento de pacientes",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pacientes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#0f766e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {children}
        <script src="/register-sw.js" defer />
      </body>
    </html>
  );
}