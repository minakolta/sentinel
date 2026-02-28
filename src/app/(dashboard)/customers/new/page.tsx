"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader, PageContainer } from "@/components/layout";
import { CustomerForm } from "@/components/forms/customer-form";

export default function NewCustomerPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="New Customer"
          description="Create a new customer account"
        />
        <div className="max-w-3xl mx-auto">
          <CustomerForm />
        </div>
      </div>
    </PageContainer>
  );
}
