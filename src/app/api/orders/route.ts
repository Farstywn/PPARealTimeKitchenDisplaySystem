import { NextResponse } from "next/server";
import { getOrders, resetOrdersStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = getOrders();
  return NextResponse.json(orders, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };
    if (body.action === "reset") {
      const orders = resetOrdersStore();
      return NextResponse.json(orders, { status: 200 });
    }
    return NextResponse.json(
      { error: "Action tidak dikenali.", code: "BAD_REQUEST" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses request.", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }
}
