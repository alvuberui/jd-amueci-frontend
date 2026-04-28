"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type FeedbackContextValue = {
  notify: (toast: { title: string; description?: string; tone?: ToastTone }) => void;
  showLoader: (label?: string) => void;
  hideLoader: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loaderLabel, setLoaderLabel] = useState<string | null>(null);

  const hideLoader = useCallback(() => {
    setLoaderLabel(null);
  }, []);

  const showLoader = useCallback((label = "Cargando") => {
    setLoaderLabel(label);
  }, []);

  const notify = useCallback(({ title, description, tone = "info" }: { title: string; description?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, description, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo<FeedbackContextValue>(() => ({
    notify,
    showLoader,
    hideLoader,
  }), [hideLoader, notify, showLoader]);

  useEffect(() => {
    if (loaderLabel) {
      setLoaderLabel(null);
    }
  }, [pathname]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto rounded-[24px] border px-4 py-4 shadow-2xl backdrop-blur-xl transition",
                toast.tone === "success" && "border-emerald-400/25 bg-emerald-500/15 text-emerald-50",
                toast.tone === "error" && "border-rose-400/25 bg-rose-500/15 text-rose-50",
                toast.tone === "info" && "border-sky-400/25 bg-sky-500/15 text-sky-50",
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm opacity-90">{toast.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loaderLabel ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/42 backdrop-blur-[3px]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/92 px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03]">
              <LoaderCircle className="size-7 animate-spin text-brand-300" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">{loaderLabel}</p>
            <p className="mt-1 text-sm text-slate-400">Es solo un momento.</p>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback debe usarse dentro de FeedbackProvider");
  }
  return context;
}
