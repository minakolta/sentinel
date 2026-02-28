"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CredentialForm } from "@/components/forms/credential-form";

interface CredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId?: string;
  customerId?: string;
  serverId?: string;
  onSuccess?: () => void;
}

export function CredentialDialog({
  open,
  onOpenChange,
  credentialId,
  customerId,
  serverId,
  onSuccess,
}: CredentialDialogProps) {
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
          <SheetTitle>{credentialId ? "Edit Credential" : "New Credential"}</SheetTitle>
          <SheetDescription>
            {credentialId
              ? "Update credential information"
              : "Add a new credential"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CredentialForm
            credentialId={credentialId}
            customerId={customerId}
            serverId={serverId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
