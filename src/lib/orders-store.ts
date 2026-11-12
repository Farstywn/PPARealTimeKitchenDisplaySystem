import { Order, OrderStatus } from "@/types/order";

function minutesSecondsAgo(minutes: number, seconds: number, baseTime: number): string {
  const offsetMs = (minutes * 60 + seconds) * 1000;
  return new Date(baseTime - offsetMs).toISOString();
}

function buildInitialOrders(baseTime = Date.now()): Order[] {
  return [
    {
      id: "ord-1",
      orderNumber: "#ORD-101",
      tableNo: "Meja 08",
      items: [
        { name: "Mie Hompimpa Lv 2", qty: 2 },
        { name: "Udang Rambutan", qty: 1 },
      ],
      status: "incoming",
      createdAt: minutesSecondsAgo(5, 12, baseTime),
    },
    {
      id: "ord-2",
      orderNumber: "#ORD-102",
      tableNo: "Meja 03",
      items: [
        { name: "Mie Gacoan Lv 3", qty: 2 },
        { name: "Udang Keju", qty: 2 },
        { name: "Es Gobak Sodor", qty: 2 },
      ],
      status: "incoming",
      createdAt: minutesSecondsAgo(3, 25, baseTime),
    },
    {
      id: "ord-3",
      orderNumber: "#ORD-103",
      tableNo: "Meja 14",
      items: [
        { name: "Mie Suit", qty: 1, notes: "Tanpa daun bawang" },
        { name: "Mie Hompimpa Lv 1", qty: 1 },
        { name: "Pangsit Goreng", qty: 2 },
        { name: "Es Teklek", qty: 2 },
      ],
      status: "incoming",
      createdAt: minutesSecondsAgo(1, 40, baseTime),
    },
    {
      id: "ord-4",
      orderNumber: "#ORD-104",
      tableNo: "Meja 05",
      items: [
        { name: "Mie Gacoan Lv 6", qty: 3, notes: "Ekstra bawang goreng" },
        { name: "Lumpia Udang", qty: 2 },
        { name: "Siomay", qty: 1 },
        { name: "Es Sluku Bathok", qty: 3 },
      ],
      status: "cooking",
      createdAt: minutesSecondsAgo(11, 8, baseTime),
    },
    {
      id: "ord-5",
      orderNumber: "#ORD-105",
      tableNo: "Meja 19",
      items: [
        { name: "Mie Hompimpa Lv 4", qty: 2 },
        { name: "Udang Rambutan", qty: 2 },
        { name: "Es Petak Umpet", qty: 2 },
      ],
      status: "cooking",
      createdAt: minutesSecondsAgo(7, 45, baseTime),
    },
    {
      id: "ord-6",
      orderNumber: "#ORD-106",
      tableNo: "Meja 02",
      items: [
        { name: "Mie Gacoan Lv 1", qty: 2 },
        { name: "Udang Keju", qty: 1 },
        { name: "Lemon Tea", qty: 2 },
      ],
      status: "cooking",
      createdAt: minutesSecondsAgo(6, 18, baseTime),
    },
    {
      id: "ord-7",
      orderNumber: "#ORD-107",
      tableNo: "Meja 15",
      items: [
        { name: "Mie Suit", qty: 2 },
        { name: "Udang Rambutan", qty: 1 },
        { name: "Lumpia Udang", qty: 1 },
      ],
      status: "ready",
      createdAt: minutesSecondsAgo(9, 30, baseTime),
    },
    {
      id: "ord-8",
      orderNumber: "#ORD-108",
      tableNo: "Meja 11",
      items: [
        { name: "Mie Gacoan Lv 2", qty: 4 },
        { name: "Udang Keju", qty: 2 },
        { name: "Siomay", qty: 2 },
        { name: "Es Gobak Sodor", qty: 4 },
      ],
      status: "ready",
      createdAt: minutesSecondsAgo(12, 50, baseTime),
    },
  ];
}

interface GlobalOrdersStore {
  orders: Order[];
  sequence: number;
}

const globalForStore = globalThis as unknown as {
  __kdsOrdersStore?: GlobalOrdersStore;
};

function getStore(): GlobalOrdersStore {
  if (!globalForStore.__kdsOrdersStore) {
    const initial = buildInitialOrders();
    globalForStore.__kdsOrdersStore = {
      orders: initial,
      sequence: initial.length + 100,
    };
  }
  return globalForStore.__kdsOrdersStore;
}

export function getOrders(): Order[] {
  return getStore().orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
  }));
}

export function getOrderById(id: string): Order | undefined {
  const found = getStore().orders.find((order) => order.id === id);
  if (!found) return undefined;
  return {
    ...found,
    items: found.items.map((item) => ({ ...item })),
  };
}

export function updateOrderStatusInStore(
  id: string,
  status: OrderStatus
): Order | null {
  const store = getStore();
  const index = store.orders.findIndex((order) => order.id === id);
  if (index === -1) {
    return null;
  }

  const updated: Order = {
    ...store.orders[index],
    status,
  };
  store.orders[index] = updated;

  return {
    ...updated,
    items: updated.items.map((item) => ({ ...item })),
  };
}

export function resetOrdersStore(): Order[] {
  const initial = buildInitialOrders();
  globalForStore.__kdsOrdersStore = {
    orders: initial,
    sequence: initial.length + 100,
  };
  return getOrders();
}
