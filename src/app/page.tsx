import React, { Suspense } from "react";
import Image from "next/image";
import { getOrders } from "@/lib/orders-store";
import { KanbanBoard } from "@/components/kds/KanbanBoard";

export const dynamic = "force-dynamic";

function KanbanBoardFallback() {
  return (
    <div className="flex-1 w-full max-w-[2560px] mx-auto px-3 sm:px-5 lg:px-6 2xl:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-5 h-full">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="h-80 md:h-full rounded-2xl bg-[#EAEFF5]/80 p-4 animate-pulse"
          >
            <div className="h-6 w-36 rounded-lg bg-slate-200 mb-4" />
            <div className="space-y-3">
              <div className="h-36 rounded-2xl bg-white/80" />
              <div className="h-36 rounded-2xl bg-white/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * KitchenDisplayPage (Server Component)
 *
 * Responsif penuh untuk:
 * - Mobile & Tablet Portrait (< 768px): Scroll vertikal adaptif + filter tab kolom
 * - Tablet Landscape (768px - 1023px): 3 kolom Kanban berdampingan
 * - Monitor Laptop & PC (1024px - 1920px): Full-viewport KDS tanpa double scrollbar
 * - Monitor TV Dapur / Ultra-Wide (> 1800px): Fluid full-width + multi-card grid per kolom
 */
export default function KitchenDisplayPage() {
  const initialOrders = getOrders();

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col bg-[#F5F7FA] text-slate-800">
      {/* Header Minimalis (Server-Rendered) */}
      <header className="bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] shrink-0 z-30">
        <div className="mx-auto w-full max-w-[2560px] px-3 sm:px-5 lg:px-6 2xl:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
          {/* Identitas Logo Mie Gacoan & PT Pesta Pora Abadi */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <Image
                src="/logo/Logo-gacoan.png"
                alt="Logo Mie Gacoan"
                width={84}
                height={40}
                priority
                className="h-7 sm:h-9 2xl:h-10 w-auto object-contain"
              />
              <Image
                src="/logo/Logo-ppa.png"
                alt="Logo PT Pesta Pora Abadi"
                width={36}
                height={36}
                priority
                className="h-7 w-7 sm:h-8 sm:w-8 2xl:h-9 2xl:w-9 object-contain"
              />
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base 2xl:text-lg font-bold tracking-tight text-slate-900 truncate">
                Kitchen Display System
              </h1>
              <p className="text-[11px] sm:text-xs 2xl:text-sm text-slate-500 truncate">
                PT Pesta Pora Abadi • Monitor Antrean Dapur
              </p>
            </div>
          </div>

          {/* Indikator Durasi Tunggu (SLA) Minimalis */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs 2xl:text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00AEEF]" />
              <span>&lt; 5m Normal</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>5–10m Pantau</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EC008C]" />
              <span>&gt; 10m Prioritas</span>
            </span>
          </div>
        </div>
      </header>

      {/* Client Island: Kanban Board & URL Search Sync */}
      <main className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<KanbanBoardFallback />}>
          <KanbanBoard initialOrders={initialOrders} />
        </Suspense>
      </main>
    </div>
  );
}
