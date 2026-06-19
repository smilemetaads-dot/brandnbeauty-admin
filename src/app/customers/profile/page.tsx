"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { RealCustomerProfilePage } from "@/features/customers/RealCustomerProfilePage";
import type { CustomerProfileRecord } from "@/features/customers/customers-data";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type CustomerProfileResponse = {
  message?: string;
  profile?: CustomerProfileRecord | null;
  success?: boolean;
};

const CUSTOMER_PROFILE_ENDPOINT = bnbApiUrl("get_customers.php");

function CustomerProfileContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone")?.trim() ?? "";
  const [profile, setProfile] = useState<CustomerProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      return;
    }

    const controller = new AbortController();

    async function loadCustomerProfile() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${CUSTOMER_PROFILE_ENDPOINT}?phone=${encodeURIComponent(phone)}`,
          {
            cache: "no-store",
            headers: adminAuthHeaders(),
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as CustomerProfileResponse;

        if (!response.ok || !payload.success || !payload.profile) {
          throw new Error(payload.message ?? "Customer profile request failed.");
        }

        setProfile(payload.profile);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Customer profile could not be loaded.", error);
          setProfile(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void Promise.resolve().then(loadCustomerProfile);

    return () => {
      controller.abort();
    };
  }, [phone]);

  if (!phone) {
    return <RealCustomerProfilePage profile={null} />;
  }

  if (isLoading) {
    return <RealCustomerProfilePage profile={null} />;
  }

  return <RealCustomerProfilePage profile={profile} />;
}

export default function CustomerProfilePage() {
  return (
    <Suspense fallback={<RealCustomerProfilePage profile={null} />}>
      <CustomerProfileContent />
    </Suspense>
  );
}
