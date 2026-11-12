import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatusInStore } from "@/lib/orders-store";
import {
  ApiErrorResponse,
  isValidOrderStatus,
  VALID_ORDER_STATUSES,
} from "@/types/order";

const ARTIFICIAL_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Parameter ID pesanan tidak valid.",
        code: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Payload JSON tidak valid atau kosong.",
        code: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }

  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Payload harus berupa objek JSON { status: string }.",
        code: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }

  const payload = rawBody as Record<string, unknown>;
  const { status, simulateError } = payload;

  if (!isValidOrderStatus(status)) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Status tidak valid. Nilai yang diizinkan: ${VALID_ORDER_STATUSES.join(", ")}.`,
        code: "INVALID_STATUS",
        details: `Menerima: ${JSON.stringify(status)}`,
      },
      { status: 400 }
    );
  }

  const existingOrder = getOrderById(id);
  if (!existingOrder) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Pesanan dengan ID "${id}" tidak ditemukan di antrean dapur.`,
        code: "NOT_FOUND",
      },
      { status: 404 }
    );
  }

  // Simulasi artificial network latency (~400ms) untuk menguji Optimistic UI & in-flight state
  await delay(ARTIFICIAL_DELAY_MS);

  const shouldFail =
    simulateError === true ||
    request.nextUrl.searchParams.get("simulateError") === "true" ||
    request.headers.get("x-simulate-error") === "true";

  if (shouldFail) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Gagal menyinkronkan status pesanan ${existingOrder.orderNumber} (${existingOrder.tableNo}) ke server dapur (Simulasi Network Drop).`,
        code: "SIMULATED_FAILURE",
      },
      { status: 503 }
    );
  }

  const updatedOrder = updateOrderStatusInStore(id, status);
  if (!updatedOrder) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Pesanan dengan ID "${id}" tidak ditemukan.`,
        code: "NOT_FOUND",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(updatedOrder, { status: 200 });
}
