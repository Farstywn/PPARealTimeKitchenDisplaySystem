"use client";

import React, { memo } from "react";

export type ToastVariant = "error" | "success" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
  rollbackBadge?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastContainerComponent({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const isError = toast.variant === "error";

        return (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition-all"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                  isError ? "bg-[#EC008C]" : "bg-[#00AEEF]"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">
                    {toast.title}
                  </p>
                  {toast.rollbackBadge && (
                    <span className="rounded-full bg-[#EC008C]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#EC008C]">
                      {toast.rollbackBadge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {toast.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            >
              Tutup
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const ToastContainer = memo(ToastContainerComponent);
