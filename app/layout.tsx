import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitGen — Treinos Personalizados com IA",
  description:
    "Gere treinos personalizados em segundos com inteligência artificial. Adapte ao seu equipamento, nível e objetivo.",
  keywords: ["treino", "academia", "personal trainer", "IA", "fitness"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
