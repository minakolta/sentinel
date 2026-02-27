"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slackSettingsSchema, type SlackSettings } from "@/lib/validations/settings";
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

interface SlackSettingsFormProps {
  initialData: {
    enabled: boolean;
    hasWebhook: boolean;
  };
  onSubmit: (data: SlackSettings) => Promise<void>;
}

export function SlackSettingsForm({ initialData, onSubmit }: SlackSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SlackSettings>({
    resolver: zodResolver(slackSettingsSchema),
    defaultValues: {
      enabled: initialData.enabled,
      webhookUrl: "",
    },
  });

  const enabled = form.watch("enabled");

  const handleFormSubmit = async (data: SlackSettings) => {
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
                <FormLabel className="text-base font-medium">Enable Slack Notifications</FormLabel>
                <FormDescription>
                  Send license expiry alerts to a Slack channel.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {initialData.hasWebhook && (
          <div className="flex items-center gap-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Webhook URL is saved. Enter a new URL to update.
          </div>
        )}

        <Separator />

        <FormField
          control={form.control}
          name="webhookUrl"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Webhook URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={!enabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Setup:</strong> Create an{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Incoming Webhook
            </a>{" "}
            in your Slack workspace and paste the URL here.
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
