"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { smtpSettingsSchema, type SmtpSettings } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";

interface SmtpSettingsFormProps {
  initialData: {
    enabled: boolean;
    hasConfig: boolean;
  };
  onSubmit: (data: SmtpSettings) => Promise<void>;
}

export function SmtpSettingsForm({ initialData, onSubmit }: SmtpSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SmtpSettings>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      enabled: initialData.enabled,
      host: "",
      port: 587,
      user: "",
      pass: "",
    },
  });

  const enabled = form.watch("enabled");

  const handleFormSubmit = async (data: SmtpSettings) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
              <div className="space-y-1">
                <FormLabel className="text-base font-medium">Enable Email Notifications</FormLabel>
                <FormDescription>
                  Send license expiry alerts via email.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {initialData.hasConfig && (
          <div className="flex items-center gap-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            SMTP configuration is saved. Enter new values to update.
          </div>
        )}

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>SMTP Host</FormLabel>
                <FormControl>
                  <Input
                    placeholder="smtp.gmail.com"
                    disabled={!enabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="587"
                    disabled={!enabled}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your-email@gmail.com"
                    disabled={!enabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pass"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Password / App Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    disabled={!enabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> For Gmail, use an{" "}
            <a
              href="https://support.google.com/accounts/answer/185833"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              App Password
            </a>{" "}
            instead of your regular password.
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
