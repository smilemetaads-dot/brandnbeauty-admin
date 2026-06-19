"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { RealOrderDetailsPage } from "@/features/orders/RealOrderDetailsPage";
import {
  fetchOrderDetails,
  type OrderDetailsRecord,
} from "@/features/orders/order-details-client";

function OrderDetailsPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [order, setOrder] = useState<OrderDetailsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    const orderId = id;
    const controller = new AbortController();

    async function loadOrder() {
      try {
        setIsLoading(true);
        const nextOrder = await fetchOrderDetails(orderId, controller.signal);
        setOrder(nextOrder);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Order details could not be loaded.", error);
          setOrder(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      controller.abort();
    };
  }, [id]);

  if (!id) {
    return <RealOrderDetailsPage order={null} />;
  }

  if (isLoading) {
    return <RealOrderDetailsPage order={null} />;
  }

  return <RealOrderDetailsPage order={order} />;
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<RealOrderDetailsPage order={null} />}>
      <OrderDetailsPageContent />
    </Suspense>
  );
}
