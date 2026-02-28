"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LicenseForm } from "@/components/forms/license-form";

interface LicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseId?: string;
  customerId?: string;
  onSuccess?: () => void;
}

export function LicenseDialog({
  open,
  onOpenChange,
  licenseId,
  customerId,
  onSuccess,
}: LicenseDialogProps) {
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
          <SheetTitle>{licenseId ? "Edit License" : "New License"}</SheetTitle>
          <SheetDescription>
            {licenseId
              ? "Update license information"
              : "Add a new license"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <LicenseForm
            licenseId={licenseId}
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
