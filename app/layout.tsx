import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "AMUECI Gestion",
  description: "Aplicacion de gestion para asociacion musical",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
