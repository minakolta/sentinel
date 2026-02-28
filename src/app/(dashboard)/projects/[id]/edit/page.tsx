"use client";

import { use, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContainer } from "@/components/layout";
import { ProjectForm } from "@/components/forms/project-form";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

function ProjectFormWrapper({ projectId }: { projectId: string }) {
  return <ProjectForm projectId={projectId} />;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
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
          title="Edit Project"
          description="Update project information"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <ProjectFormWrapper projectId={id} />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
