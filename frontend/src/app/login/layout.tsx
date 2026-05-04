import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — MindCare",
  description: "Accede a tu cuenta de MindCare para continuar con tu bienestar emocional.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
