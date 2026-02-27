"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { alertSettingsSchema, type AlertSettings } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { X, Plus, Loader2 } from "lucide-react";

interface AlertSettingsFormProps {
  initialData: AlertSettings;
  onSubmit: (data: AlertSettings) => Promise<void>;
}

export function AlertSettingsForm({ initialData, onSubmit }: AlertSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWindow, setNewWindow] = useState("");
  const [windows, setWindows] = useState<number[]>(
    [...(initialData.windows || [60, 30, 14, 7, 3, 1])].sort((a, b) => b - a)
  );

  const form = useForm<AlertSettings>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      windows: windows,
    },
  });

  const addWindow = () => {
    const days = parseInt(newWindow, 10);
    if (isNaN(days) || days <= 0 || days > 365) return;

    if (!windows.includes(days)) {
      const updated = [...windows, days].sort((a, b) => b - a);
      setWindows(updated);
      form.setValue("windows", updated);
    }
    setNewWindow("");
  };

  const removeWindow = (days: number) => {
    const updated = windows.filter((w) => w !== days);
    setWindows(updated);
    form.setValue("windows", updated);
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ windows });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Alert Windows</h4>
            <p className="text-sm text-muted-foreground">
              Specify when to send notifications (days before license expiry).
            </p>
          </div>
          
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Enter days"
              min={1}
              max={365}
              value={newWindow}
              onChange={(e) => setNewWindow(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addWindow();
                }
              }}
              className="w-36"
            />
            <Button type="button" variant="outline" onClick={addWindow}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {windows.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {windows.map((days) => (
                <Badge 
                  key={days} 
                  variant="secondary" 
                  className="gap-1.5 px-3 py-1.5 text-sm font-medium"
                >
                  {days} {days === 1 ? "day" : "days"}
                  <button
                    type="button"
                    onClick={() => removeWindow(days)}
                    className="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
                    disabled={windows.length === 1}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {form.formState.errors.windows && (
            <p className="text-sm text-destructive">
              {form.formState.errors.windows.message}
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Example:</strong> With windows set to 60, 30, 14, 7, 3, 1 days, 
            you&apos;ll receive notifications at each interval before a license expires.
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
