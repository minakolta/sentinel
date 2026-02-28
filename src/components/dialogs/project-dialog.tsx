"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProjectForm } from "@/components/forms/project-form";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  customerId?: string;
  onSuccess?: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  projectId,
  customerId,
  onSuccess,
}: ProjectDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{projectId ? "Edit Project" : "New Project"}</SheetTitle>
          <SheetDescription>
            {projectId
              ? "Update project information"
              : "Add a new project"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ProjectForm
            projectId={projectId}
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
