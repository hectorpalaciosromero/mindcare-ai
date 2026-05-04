import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MindCare AI — Bienestar emocional inteligente",
  description:
    "Plataforma inteligente impulsada por IA Gemini para registrar y analizar tu estado emocional diario, ofreciendo apoyo continuo 24/7 y optimizando tus sesiones de terapia.",
  keywords: ["salud mental", "IA", "bienestar emocional", "psicología", "pacientes", "terapia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
