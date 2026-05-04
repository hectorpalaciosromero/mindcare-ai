import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro — MindCare",
  description: "Crea tu cuenta como paciente o psicólogo en MindCare.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
