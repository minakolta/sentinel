"use client";

import { use, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContainer } from "@/components/layout";
import { CustomerForm } from "@/components/forms/customer-form";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = use(params);
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
          title="Edit Customer"
          description="Update customer information"
        />
        <div className="max-w-3xl mx-auto">
          <CustomerForm customerId={id} />
        </div>
      </div>
    </PageContainer>
  );
}
