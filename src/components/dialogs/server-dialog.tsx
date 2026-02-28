"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServerForm } from "@/components/forms/server-form";

interface ServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId?: string;
  customerId?: string;
  onSuccess?: () => void;
}

export function ServerDialog({
  open,
  onOpenChange,
  serverId,
  customerId,
  onSuccess,
}: ServerDialogProps) {
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
          <SheetTitle>{serverId ? "Edit Server" : "New Server"}</SheetTitle>
          <SheetDescription>
            {serverId
              ? "Update server information"
              : "Add a new server"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ServerForm
            serverId={serverId}
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
