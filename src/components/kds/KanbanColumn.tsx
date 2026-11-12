"use client";

import React, { memo, useState } from "react";
import { KanbanColumnConfig, Order, OrderStatus } from "@/types/order";
import { OrderCard } from "./OrderCard";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  orders: Order[];
  pendingOrderIds: ReadonlySet<string>;
  isDraggingAny: boolean;
  onStatusChange: (orderId: string, targetStatus: OrderStatus) => void;
  onDragStartOrder: (orderId: string) => void;
  onDragEndOrder: () => void;
}

function getColumnHeaderVisuals(status: OrderStatus) {
  switch (status) {
    case "incoming":
      return {
        dotColor: "bg-[#00AEEF]",
        countBadge: "bg-[#00AEEF]/15 text-[#007EA8]",
        dropSurface: "bg-[#00AEEF]/10",
      };
    case "cooking":
      return {
        dotColor: "bg-[#EC008C]",
        countBadge: "bg-[#EC008C]/15 text-[#EC008C]",
        dropSurface: "bg-[#EC008C]/10",
      };
    case "ready":
      return {
        dotColor: "bg-emerald-500",
        countBadge: "bg-emerald-500/15 text-emerald-700",
        dropSurface: "bg-emerald-500/10",
      };
  }
}

function KanbanColumnComponent({
  column,
  orders,
  pendingOrderIds,
  isDraggingAny,
  onStatusChange,
  onDragStartOrder,
  onDragEndOrder,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const visuals = getColumnHeaderVisuals(column.id);

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedOrderId = e.dataTransfer.getData("text/plain");
    if (draggedOrderId) {
      onStatusChange(draggedOrderId, column.id);
    }
  };

  return (
    <section
      aria-label={`Kolom ${column.title}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-h-[260px] md:min-h-0 md:h-full rounded-2xl transition-colors duration-150 ${
        isDragOver
          ? visuals.dropSurface
          : isDraggingAny
            ? "bg-slate-200/70"
            : "bg-[#EAEFF5]/80"
      }`}
    >
      {/* Header Kolom Minimalis */}
      <header className="shrink-0 flex items-center justify-between gap-2 px-3.5 lg:px-4 pt-3.5 lg:pt-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${visuals.dotColor}`} />
            <h2 className="text-sm 2xl:text-base font-bold tracking-wide text-slate-900 truncate">
              {column.title}
            </h2>
          </div>
          <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5 pl-4.5 truncate">
            {column.subtitle}
          </p>
        </div>

        <span
          className={`shrink-0 inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full px-2.5 font-mono text-xs 2xl:text-sm font-bold ${visuals.countBadge}`}
        >
          {orders.length}
        </span>
      </header>

      {/* Daftar Kartu Pesanan: 1 kolom di Tablet/Laptop/PC, otomatis 2 kolom per papan di Monitor TV Lebar (>= 1900px) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3.5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 rounded-xl bg-white/50 p-5 text-center">
            <p className="text-sm font-medium text-slate-500">
              Belum ada pesanan di {column.title}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Geser kartu ke sini atau klik tombol status pada pesanan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[1900px]:grid-cols-2 gap-3 items-start">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isPending={pendingOrderIds.has(order.id)}
                onStatusChange={onStatusChange}
                onDragStartOrder={onDragStartOrder}
                onDragEndOrder={onDragEndOrder}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export const KanbanColumn = memo(KanbanColumnComponent);
