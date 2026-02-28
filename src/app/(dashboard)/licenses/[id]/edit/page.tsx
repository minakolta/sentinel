"use client";

import { use, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContainer } from "@/components/layout";
import { LicenseForm } from "@/components/forms/license-form";

interface EditLicensePageProps {
  params: Promise<{ id: string }>;
}

function LicenseFormWrapper({ licenseId }: { licenseId: string }) {
  return <LicenseForm licenseId={licenseId} />;
}

export default function EditLicensePage({ params }: EditLicensePageProps) {
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
          title="Edit License"
          description="Update license information"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <LicenseFormWrapper licenseId={id} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
