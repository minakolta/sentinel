"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FirewallRuleForm } from "@/components/forms/firewall-rule-form";

interface FirewallRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId?: string;
  customerId?: string;
  onSuccess?: () => void;
}

export function FirewallRuleDialog({
  open,
  onOpenChange,
  ruleId,
  customerId,
  onSuccess,
}: FirewallRuleDialogProps) {
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
          <SheetTitle>{ruleId ? "Edit Firewall Rule" : "New Firewall Rule"}</SheetTitle>
          <SheetDescription>
            {ruleId
              ? "Update firewall rule configuration"
              : "Add a new firewall rule"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <FirewallRuleForm
            ruleId={ruleId}
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
