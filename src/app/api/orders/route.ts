import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isAuthenticated } from "@/lib/auth";
import {
  OrderSaveError,
  updateOrderStatusWithServiceRole,
} from "@/lib/orders/supabaseOrders";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();

  if (!isAuthenticated(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      id?: string;
      orderStatus?: string;
    };

    if (!payload.id || !payload.orderStatus) {
      return NextResponse.json(
        { error: "Order id and status are required." },
        { status: 400 },
      );
    }

    const order = await updateOrderStatusWithServiceRole({
      id: payload.id,
      orderStatus: payload.orderStatus,
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof OrderSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Order status could not be updated." },
      { status: 500 },
    );
  }
}
