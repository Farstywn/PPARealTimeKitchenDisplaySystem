"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import {
  getNextOrderStatus,
  getPreviousOrderStatus,
  Order,
  OrderStatus,
} from "@/types/order";
import { OrderTimer } from "./OrderTimer";

interface OrderCardProps {
  order: Order;
  isPending: boolean;
  onStatusChange: (orderId: string, targetStatus: OrderStatus) => void;
  onDragStartOrder: (orderId: string) => void;
  onDragEndOrder: () => void;
}

function parseMenuSpicyLevel(itemName: string): {
  baseName: string;
  spicyLevel: string | null;
  levelNumber: number;
} {
  const match = itemName.match(/^(.*?)\s+(Lv\s*(\d+))$/i);
  if (!match) {
    return { baseName: itemName, spicyLevel: null, levelNumber: 0 };
  }
  return {
    baseName: match[1],
    spicyLevel: match[2],
    levelNumber: parseInt(match[3], 10) || 0,
  };
}

/**
 * OrderCard: Komponen kartu pesanan yang diisolasi dengan React.memo.
 * State checklist item disimpan secara lokal di dalam kartu ini agar interaksi
 * centang per menu tidak memicu re-render ke parent board maupun kartu lain.
 */
function OrderCardComponent({
  order,
  isPending,
  onStatusChange,
  onDragStartOrder,
  onDragEndOrder,
}: OrderCardProps) {
  const nextStatus = getNextOrderStatus(order.status);
  const prevStatus = getPreviousOrderStatus(order.status);

  // State lokal untuk menandai item menu yang sudah selesai disiapkan pada kartu ini
  const [checkedItems, setCheckedItems] = useState<ReadonlySet<number>>(
    () => new Set()
  );
  const prevStatusRef = useRef<OrderStatus>(order.status);

  // Sinkronisasi state checklist saat kartu berpindah kolom atau terkena rollback
  useEffect(() => {
    const previous = prevStatusRef.current;
    const current = order.status;

    if (previous !== current) {
      // Jika kartu di-rollback dari "ready" kembali ke "cooking", atau baru masuk ke "cooking" dari "incoming"
      if (
        (previous === "ready" && current === "cooking") ||
        (previous === "incoming" && current === "cooking") ||
        current === "incoming"
      ) {
        setCheckedItems(new Set());
      }
      prevStatusRef.current = current;
    }
  }, [order.status]);

  const totalQty = order.items.reduce((acc, item) => acc + item.qty, 0);
  const isReadyColumn = order.status === "ready";
  const completedCount = isReadyColumn ? order.items.length : checkedItems.size;

  const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
    e.dataTransfer.setData("text/plain", order.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStartOrder(order.id);
  };

  const handleToggleItem = (index: number) => {
    if (isReadyColumn) return;

    const nextSet = new Set(checkedItems);
    if (nextSet.has(index)) {
      nextSet.delete(index);
    } else {
      nextSet.add(index);
    }

    setCheckedItems(nextSet);

    // Jika seluruh item pada kartu telah dicentang selesai, otomatis pindahkan ke status berikutnya
    if (nextSet.size === order.items.length && nextStatus) {
      onStatusChange(order.id, nextStatus);
    }
  };

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEndOrder}
      aria-label={`Pesanan ${order.orderNumber} ${order.tableNo}`}
      className="flex flex-col rounded-2xl bg-white p-3.5 lg:p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition-shadow duration-150 cursor-grab active:cursor-grabbing"
    >
      {/* Header Kartu: Nomor Order, Meja, dan Isolated Live Timer */}
      <div className="flex items-center justify-between gap-2 pb-2.5 lg:pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
          <span className="font-mono text-sm lg:text-base 2xl:text-lg font-bold tracking-tight text-slate-900">
            {order.orderNumber}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#00AEEF]/10 px-2 lg:px-2.5 py-0.5 text-[11px] lg:text-xs font-semibold text-[#007EA8]">
            {order.tableNo}
          </span>
        </div>

        <OrderTimer createdAt={order.createdAt} status={order.status} />
      </div>

      {/* Daftar Item Menu Pesanan (Klik baris item untuk ceklis selesai) */}
      <ul
        className="py-1 lg:py-1.5 space-y-1 flex-1 divide-y divide-slate-100"
        aria-label="Daftar item pesanan"
      >
        {order.items.map((item, idx) => {
          const { baseName, spicyLevel, levelNumber } = parseMenuSpicyLevel(
            item.name
          );
          const isHighSpicy = levelNumber >= 4;
          const isItemDone = isReadyColumn || checkedItems.has(idx);

          return (
            <li
              key={`${order.id}-item-${idx}`}
              className={idx > 0 ? "pt-1" : ""}
            >
              <button
                type="button"
                disabled={isReadyColumn}
                onClick={() => handleToggleItem(idx)}
                aria-pressed={isItemDone}
                className={`group/item w-full flex items-start justify-between gap-2.5 rounded-lg -mx-1.5 px-1.5 py-1.5 text-left transition-colors ${
                  isReadyColumn
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Indikator Ceklis Minimalis */}
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isItemDone
                        ? "bg-emerald-500 text-white"
                        : "border border-slate-300 bg-white group-hover/item:border-[#00AEEF]"
                    }`}
                  >
                    {isItemDone && (
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className="h-2.5 w-2.5 stroke-current stroke-[2.2]"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6.2L5 8.6L9.5 3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm 2xl:text-base font-medium leading-snug transition-colors ${
                          !isReadyColumn && isItemDone
                            ? "line-through text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {baseName}
                      </span>
                      {spicyLevel && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] lg:text-[11px] font-semibold transition-opacity ${
                            !isReadyColumn && isItemDone ? "opacity-45" : ""
                          } ${
                            isHighSpicy
                              ? "bg-[#8B1116]/10 text-[#8B1116]"
                              : "bg-[#EC008C]/10 text-[#EC008C]"
                          }`}
                        >
                          {spicyLevel}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p
                        className={`mt-0.5 text-[11px] lg:text-xs ${
                          !isReadyColumn && isItemDone
                            ? "line-through text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-mono text-xs 2xl:text-sm font-semibold shrink-0 transition-colors ${
                    isItemDone
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.qty}x
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Kartu: Progres Item, Total Porsi, Status Sync In-Flight, & Tombol Transisi */}
      <div className="mt-2.5 lg:mt-3 flex items-center justify-between gap-2 bg-slate-50/70 -mx-3.5 lg:-mx-4 -mb-3.5 lg:-mb-4 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-b-2xl flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {!isReadyColumn && completedCount > 0 && (
              <span className="font-semibold text-emerald-600 mr-1.5">
                {completedCount}/{order.items.length} selesai •
              </span>
            )}
            <strong className="font-semibold text-slate-700">{totalQty}</strong>{" "}
            porsi
          </span>

          {isPending && (
            <span
              className="inline-flex items-center rounded-full bg-[#00AEEF]/10 px-2 py-0.5 text-[11px] font-medium text-[#007EA8] animate-pulse"
              role="status"
              aria-live="polite"
            >
              Menyinkronkan...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {prevStatus && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, prevStatus)}
              title={`Kembalikan ke kolom ${prevStatus.toUpperCase()}`}
              className="rounded-lg bg-slate-200/70 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 active:scale-[0.98] transition-all"
            >
              Kembali
            </button>
          )}

          {nextStatus === "cooking" && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "cooking")}
              className="rounded-lg bg-[#EC008C] hover:bg-[#D4007D] active:scale-[0.98] px-3 lg:px-3.5 py-1.5 text-xs font-semibold text-white transition-all"
            >
              Masak
            </button>
          )}

          {nextStatus === "ready" && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "ready")}
              className="rounded-lg bg-[#00AEEF] hover:bg-[#0095CC] active:scale-[0.98] px-3 lg:px-3.5 py-1.5 text-xs font-semibold text-white transition-all"
            >
              Siap Saji
            </button>
          )}

          {!nextStatus && (
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              Siap Diantar
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export const OrderCard = memo(
  OrderCardComponent,
  (prev, next) =>
    prev.order === next.order &&
    prev.isPending === next.isPending &&
    prev.onStatusChange === next.onStatusChange &&
    prev.onDragStartOrder === next.onDragStartOrder &&
    prev.onDragEndOrder === next.onDragEndOrder
);
