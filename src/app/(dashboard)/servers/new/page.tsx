"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { PageHeader, PageContainer } from "@/components/layout";
import { ServerForm } from "@/components/forms/server-form";

function ServerFormContent() {
  return <ServerForm />;
}

export default function NewServerPage() {
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
          title="New Server"
          description="Add a new server to your infrastructure"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <ServerFormContent />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
