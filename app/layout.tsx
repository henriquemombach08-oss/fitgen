import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import SWRegister from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "FitGen — Treinos Personalizados com IA",
  description:
    "Gere treinos personalizados em segundos com inteligência artificial. Adapte ao seu equipamento, nível e objetivo.",
  keywords: ["treino", "academia", "personal trainer", "IA", "fitness"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitGen",
  },
  icons: {
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
        <SWRegister />
      </body>
    </html>
  );
}
