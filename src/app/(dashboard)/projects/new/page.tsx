"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { PageHeader, PageContainer } from "@/components/layout";
import { ProjectForm } from "@/components/forms/project-form";

function ProjectFormContent() {
  return <ProjectForm />;
}

export default function NewProjectPage() {
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
          title="New Project"
          description="Create a new project"
        />
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <ProjectFormContent />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
