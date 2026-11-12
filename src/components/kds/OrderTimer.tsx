"use client";

import React, { memo, useEffect, useRef } from "react";
import { OrderStatus } from "@/types/order";

interface OrderTimerProps {
  createdAt: string;
  status: OrderStatus;
}

type TimerUrgency = "normal" | "warning" | "critical" | "completed";

export function formatElapsedDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}j ${minutes}m ${seconds}s lalu`;
  }
  return `${minutes}m ${seconds}s lalu`;
}

function resolveUrgency(elapsedSeconds: number, status: OrderStatus): TimerUrgency {
  if (status === "ready") return "completed";
  if (elapsedSeconds >= 600) return "critical";
  if (elapsedSeconds >= 300) return "warning";
  return "normal";
}

/**
 * OrderTimer: Leaf Component terisolasi untuk menampilkan durasi tunggu real-time.
 * Memperbarui DOM langsung via `useRef` tanpa memicu siklus re-render React.
 */
function OrderTimerComponent({ createdAt, status }: OrderTimerProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const startTimestamp = Date.parse(createdAt);
    if (Number.isNaN(startTimestamp)) {
      if (textRef.current) {
        textRef.current.textContent = "0m 0s lalu";
      }
      return;
    }

    const updateDomTick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);

      if (textRef.current) {
        const nextText = formatElapsedDuration(elapsedSeconds);
        if (textRef.current.textContent !== nextText) {
          textRef.current.textContent = nextText;
        }
      }

      if (badgeRef.current) {
        const nextUrgency = resolveUrgency(elapsedSeconds, status);
        if (badgeRef.current.dataset.urgency !== nextUrgency) {
          badgeRef.current.dataset.urgency = nextUrgency;
        }
      }
    };

    updateDomTick();

    const intervalId = window.setInterval(updateDomTick, 1000);
    return () => window.clearInterval(intervalId);
  }, [createdAt, status]);

  return (
    <div
      ref={badgeRef}
      data-urgency={status === "ready" ? "completed" : "normal"}
      className="kds-timer-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200"
      title={`Waktu pesanan masuk: ${new Date(createdAt).toLocaleTimeString("id-ID")}`}
    >
      <span className="kds-timer-dot h-1.5 w-1.5 rounded-full shrink-0" />
      <span
        ref={textRef}
        suppressHydrationWarning
        className="font-mono tabular-nums tracking-tight"
      >
        --m --s lalu
      </span>
    </div>
  );
}

export const OrderTimer = memo(
  OrderTimerComponent,
  (prev, next) =>
    prev.createdAt === next.createdAt && prev.status === next.status
);
