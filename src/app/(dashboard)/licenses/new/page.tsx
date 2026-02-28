"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { PageHeader, PageContainer } from "@/components/layout";
import { LicenseForm } from "@/components/forms/license-form";

function LicenseFormContent() {
  return <LicenseForm />;
}

export default function NewLicensePage() {
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
          title="New License"
          description="Add a new software license"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <LicenseFormContent />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
