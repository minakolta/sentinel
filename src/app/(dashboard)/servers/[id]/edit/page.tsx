"use client";

import { use, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContainer } from "@/components/layout";
import { ServerForm } from "@/components/forms/server-form";

interface EditServerPageProps {
  params: Promise<{ id: string }>;
}

function ServerFormWrapper({ serverId }: { serverId: string }) {
  return <ServerForm serverId={serverId} />;
}

export default function EditServerPage({ params }: EditServerPageProps) {
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
          title="Edit Server"
          description="Update server information"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <ServerFormWrapper serverId={id} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
