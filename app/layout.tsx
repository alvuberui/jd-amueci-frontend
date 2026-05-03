import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { FeedbackProvider } from "@/components/feedback-provider";

export const metadata: Metadata = {
  title: "AMUECI Gestion",
  description: "Aplicacion de gestion para asociacion musical",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <FeedbackProvider>
          <AuthProvider>
            {children}
            <a
              href="https://alvaroubedaruiz.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-4 right-4 z-50 rounded-full border border-white/10 bg-slate-950/55 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 backdrop-blur-md transition hover:border-white/20 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
            >
              Desarrollada por Alvaro Ubeda Ruiz · 2026
            </a>
          </AuthProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
