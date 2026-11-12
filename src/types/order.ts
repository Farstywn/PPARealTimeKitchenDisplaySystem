export type OrderStatus = "incoming" | "cooking" | "ready";

export const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  "incoming",
  "cooking",
  "ready",
] as const;

export interface OrderItem {
  name: string;
  qty: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNo: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  simulateError?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code: "BAD_REQUEST" | "INVALID_STATUS" | "NOT_FOUND" | "SIMULATED_FAILURE";
  details?: string;
}

export interface KanbanColumnConfig {
  id: OrderStatus;
  title: string;
  subtitle: string;
  badgeLabel: string;
}

export const KANBAN_COLUMNS: readonly KanbanColumnConfig[] = [
  {
    id: "incoming",
    title: "Incoming",
    subtitle: "Pesanan Baru Masuk",
    badgeLabel: "Antrean Masuk",
  },
  {
    id: "cooking",
    title: "Cooking",
    subtitle: "Sedang Dimasak di Wok / Fryer",
    badgeLabel: "Diproses Dapur",
  },
  {
    id: "ready",
    title: "Ready",
    subtitle: "Siap Diantar ke Meja / Pickup",
    badgeLabel: "Siap Saji",
  },
] as const;

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (VALID_ORDER_STATUSES as readonly string[]).includes(value)
  );
}

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case "incoming":
      return "cooking";
    case "cooking":
      return "ready";
    case "ready":
      return null;
  }
}

export function getPreviousOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case "incoming":
      return null;
    case "cooking":
      return "incoming";
    case "ready":
      return "cooking";
  }
}
