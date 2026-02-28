"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomerForm } from "@/components/forms/customer-form";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  onSuccess?: () => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}: CustomerDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customerId ? "Edit Customer" : "New Customer"}</SheetTitle>
          <SheetDescription>
            {customerId
              ? "Update customer information"
              : "Add a new customer to your organization"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CustomerForm
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
