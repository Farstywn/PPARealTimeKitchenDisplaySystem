"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ApiErrorResponse,
  KANBAN_COLUMNS,
  Order,
  OrderStatus,
} from "@/types/order";
import { KanbanColumn } from "./KanbanColumn";
import { SearchBar } from "./SearchBar";
import { ToastContainer, ToastMessage } from "@/components/ui/ToastContainer";

interface KanbanBoardProps {
  initialOrders: Order[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  incoming: "INCOMING",
  cooking: "COOKING",
  ready: "READY",
};

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") ?? "").trim().toLowerCase();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [pendingOrderIds, setPendingOrderIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [simulateNetworkError, setSimulateNetworkError] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<
    OrderStatus | "all"
  >("all");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const ordersRef = useRef<Order[]>(orders);
  ordersRef.current = orders;

  const simulateErrorRef = useRef<boolean>(simulateNetworkError);
  simulateErrorRef.current = simulateNetworkError;

  const confirmedStatusRef = useRef<Map<string, OrderStatus>>(
    new Map(initialOrders.map((o) => [o.id, o.status]))
  );

  const requestSeqRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  const handleStatusChange = useCallback(
    async (orderId: string, targetStatus: OrderStatus) => {
      const currentOrder = ordersRef.current.find(
        (item) => item.id === orderId
      );
      if (!currentOrder || currentOrder.status === targetStatus) {
        return;
      }

      const previousConfirmedStatus =
        confirmedStatusRef.current.get(orderId) ?? currentOrder.status;

      const currentSeq = (requestSeqRef.current.get(orderId) ?? 0) + 1;
      requestSeqRef.current.set(orderId, currentSeq);

      // 1. OPTIMISTIC UPDATE: Pindahkan kartu seketika di UI (0ms latency)
      setOrders((prevOrders) =>
        prevOrders.map((item) =>
          item.id === orderId ? { ...item, status: targetStatus } : item
        )
      );

      setPendingOrderIds((prevSet) => {
        const next = new Set(prevSet);
        next.add(orderId);
        return next;
      });

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: targetStatus,
            simulateError: simulateErrorRef.current,
          }),
        });

        if (requestSeqRef.current.get(orderId) !== currentSeq) {
          return;
        }

        if (!response.ok) {
          const errorBody = (await response
            .json()
            .catch(() => null)) as ApiErrorResponse | null;
          throw new Error(
            errorBody?.error ??
              `Server merespons dengan status HTTP ${response.status}.`
          );
        }

        const updatedOrder = (await response.json()) as Order;
        confirmedStatusRef.current.set(orderId, updatedOrder.status);
      } catch (err) {
        if (requestSeqRef.current.get(orderId) !== currentSeq) {
          return;
        }

        // 2. TARGETED ROLLBACK: Kembalikan hanya kartu yang gagal ke posisi semula
        setOrders((prevOrders) =>
          prevOrders.map((item) =>
            item.id === orderId
              ? { ...item, status: previousConfirmedStatus }
              : item
          )
        );

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Terjadi gangguan jaringan saat menghubungi server dapur.";

        pushToast({
          variant: "error",
          title: `Gagal Update ${currentOrder.orderNumber} (${currentOrder.tableNo})`,
          rollbackBadge: `Rollback: ${STATUS_LABELS[targetStatus]} → ${STATUS_LABELS[previousConfirmedStatus]}`,
          description: `${errorMessage} Posisi kartu telah dikembalikan otomatis ke kolom ${STATUS_LABELS[previousConfirmedStatus]}.`,
        });
      } finally {
        if (requestSeqRef.current.get(orderId) === currentSeq) {
          setPendingOrderIds((prevSet) => {
            if (!prevSet.has(orderId)) return prevSet;
            const next = new Set(prevSet);
            next.delete(orderId);
            return next;
          });
        }
      }
    },
    [pushToast]
  );

  const handleDragStartOrder = useCallback(() => {
    setIsDraggingAny(true);
  }, []);

  const handleDragEndOrder = useCallback(() => {
    setIsDraggingAny(false);
  }, []);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (response.ok) {
        const freshOrders = (await response.json()) as Order[];
        confirmedStatusRef.current = new Map(
          freshOrders.map((o) => [o.id, o.status])
        );
        requestSeqRef.current.clear();
        setPendingOrderIds(new Set());
        setOrders(freshOrders);
        pushToast({
          variant: "info",
          title: "Antrean Direset",
          description:
            "Data antrean telah dikembalikan ke 8 pesanan awal Mie Gacoan.",
        });
      }
    } finally {
      setIsResetting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    return orders.filter((order) => {
      const matchOrderNo = order.orderNumber
        .toLowerCase()
        .includes(searchQuery);
      const matchTableNo = order.tableNo.toLowerCase().includes(searchQuery);
      const matchItems = order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery)
      );
      return matchOrderNo || matchTableNo || matchItems;
    });
  }, [orders, searchQuery]);

  // Pengelompokan pesanan ke 3 kolom Kanban dengan urutan FIFO (waktu tunggu terlama di paling atas)
  const groupedColumns = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      incoming: [],
      cooking: [],
      ready: [],
    };
    for (const order of filteredOrders) {
      map[order.status].push(order);
    }
    for (const status of Object.keys(map) as OrderStatus[]) {
      map[status].sort(
        (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
      );
    }
    return map;
  }, [filteredOrders]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Control Bar Responsif */}
      <div className="shrink-0 px-3 sm:px-5 lg:px-6 2xl:px-8 pt-3 sm:pt-4 pb-1">
        <div className="mx-auto w-full max-w-[2560px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <SearchBar
              totalMatched={filteredOrders.length}
              totalOrders={orders.length}
            />

            {pendingOrderIds.size > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#00AEEF]/10 px-3 py-1.5 text-xs font-medium text-[#007EA8]">
                <span className="h-2 w-2 rounded-full bg-[#00AEEF] animate-ping" />
                <span>
                  Menyinkronkan {pendingOrderIds.size} pesanan (~400ms)...
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulateNetworkError((prev) => !prev)}
              aria-pressed={simulateNetworkError}
              className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold transition-all ${
                simulateNetworkError
                  ? "bg-[#EC008C] text-white shadow-sm"
                  : "bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:text-slate-900"
              }`}
              title="Aktifkan untuk menguji mekanisme rollback otomatis saat request PATCH gagal setelah delay 400ms"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  simulateNetworkError ? "bg-white" : "bg-emerald-500"
                }`}
              />
              <span>
                {simulateNetworkError
                  ? "Simulasi Gagal API: Aktif"
                  : "Simulasi Gagal API: Nonaktif"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isResetting}
              className="rounded-xl bg-white px-3 sm:px-3.5 py-2 text-xs font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:text-slate-900 disabled:opacity-50 transition-all"
            >
              {isResetting ? "Mereset..." : "Reset Antrean"}
            </button>
          </div>
        </div>

        {simulateNetworkError && (
          <div className="mx-auto w-full max-w-[2560px] mt-2.5 rounded-xl bg-[#EC008C]/10 px-3.5 py-2 text-xs text-[#A30060]">
            <strong>Mode Uji Rollback Aktif:</strong> Pindahkan salah satu kartu
            pesanan. Kartu akan berpindah seketika (Optimistic UI), lalu otomatis{" "}
            <strong>rollback</strong> ke kolom semula setelah ~400ms karena
            simulasi error jaringan.
          </div>
        )}

        {/* Navigasi Tab Kolom untuk Layar Kecil / Smartphone (< 768px) */}
        <div className="md:hidden mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setMobileActiveColumn("all")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              mobileActiveColumn === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            Semua ({filteredOrders.length})
          </button>
          {KANBAN_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveColumn(col.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                mobileActiveColumn === col.id
                  ? col.id === "incoming"
                    ? "bg-[#00AEEF] text-white"
                    : col.id === "cooking"
                      ? "bg-[#EC008C] text-white"
                      : "bg-emerald-600 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              {col.title} ({groupedColumns[col.id].length})
            </button>
          ))}
        </div>
      </div>

      {/* Area Papan Kanban 3 Kolom (Responsif di Mobile, Tablet, Laptop, PC, hingga TV 4K) */}
      <div className="flex-1 min-h-0 mx-auto w-full max-w-[2560px] px-3 sm:px-5 lg:px-6 2xl:px-8 py-3 sm:py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-5 2xl:gap-6 h-full">
          {KANBAN_COLUMNS.map((col) => {
            const isHiddenOnMobile =
              mobileActiveColumn !== "all" && mobileActiveColumn !== col.id;

            return (
              <div
                key={col.id}
                className={`${
                  isHiddenOnMobile ? "hidden md:flex" : "flex"
                } flex-col min-h-0 h-full`}
              >
                <KanbanColumn
                  column={col}
                  orders={groupedColumns[col.id]}
                  pendingOrderIds={pendingOrderIds}
                  isDraggingAny={isDraggingAny}
                  onStatusChange={handleStatusChange}
                  onDragStartOrder={handleDragStartOrder}
                  onDragEndOrder={handleDragEndOrder}
                />
              </div>
            );
          })}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
