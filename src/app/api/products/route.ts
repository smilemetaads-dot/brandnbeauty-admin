import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isAuthenticated } from "@/lib/auth";
import {
  ProductSaveError,
  saveProductWithServiceRole,
} from "@/lib/products/supabaseProductWrites";
import type { ProductRecord } from "@/lib/types/product";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  if (!isAuthenticated(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = (await request.json()) as ProductRecord;
    const savedProduct = await saveProductWithServiceRole(product);

    return NextResponse.json({ product: savedProduct });
  } catch (error) {
    if (error instanceof ProductSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Product could not be saved.",
      },
      { status: 500 },
    );
  }
}
