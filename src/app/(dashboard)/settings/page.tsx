"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/forms/settings/org-settings-form";
import { AlertSettingsForm } from "@/components/forms/settings/alert-settings-form";
import { SmtpSettingsForm } from "@/components/forms/settings/smtp-settings-form";
import { SlackSettingsForm } from "@/components/forms/settings/slack-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
import { Building2, Bell, Mail, MessageSquare } from "lucide-react";

interface Settings {
  "org.name": string;
  "org.allowedDomains": string[];
  "org.logo": string | null;
  "alerts.windows": number[];
  "smtp.enabled": boolean;
  "smtp.config": string | null;
  "slack.enabled": boolean;
  "slack.webhookUrl": string | null;
}

const sections = [
  { id: "organization", label: "Organization", icon: Building2, description: "Name, logo, and domains" },
  { id: "alerts", label: "Alerts", icon: Bell, description: "License expiry notifications" },
  { id: "email", label: "Email", icon: Mail, description: "SMTP configuration" },
  { id: "slack", label: "Slack", icon: MessageSquare, description: "Webhook integration" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("organization");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update settings");
      }

      toast.success("Settings updated successfully");
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
      throw error;
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Settings"
            description="Manage organization and integrations"
          />
          <SettingsPageSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage organization and integrations"
        />
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            {/* Side Navigation */}
            <nav className="w-full md:w-56 md:shrink-0">
              <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:space-y-1 md:overflow-visible md:pb-0">
                {sections.map((section) => (
                  <li key={section.id} className="shrink-0 md:shrink">
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors whitespace-nowrap md:whitespace-normal",
                        activeSection === section.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <section.icon className="h-4 w-4 shrink-0" />
                      <span className="md:hidden">{section.label}</span>
                      <div className="hidden min-w-0 md:block">
                        <div className="truncate">{section.label}</div>
                        <div className="truncate text-xs text-muted-foreground/70">{section.description}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeSection === "organization" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>
                      Configure your organization name, logo, and allowed email domains for login.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings && (
                      <OrgSettingsForm
                        initialData={{
                          name: settings["org.name"],
                          allowedDomains: settings["org.allowedDomains"],
                          logo: settings["org.logo"] || "",
                        }}
                        onSubmit={(data) => updateSettings("org", data)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSection === "alerts" && (
                <Card>
                  <CardHeader>
                    <CardTitle>License Expiry Alerts</CardTitle>
                    <CardDescription>
                      Configure when to send notifications before licenses expire.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings && (
                      <AlertSettingsForm
                        initialData={{
                          windows: settings["alerts.windows"],
                        }}
                        onSubmit={(data) => updateSettings("alerts", data)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSection === "email" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Email (SMTP)</CardTitle>
                    <CardDescription>
                      Configure SMTP settings for sending email notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings && (
                      <SmtpSettingsForm
                        initialData={{
                          enabled: settings["smtp.enabled"],
                          hasConfig: settings["smtp.config"] !== null,
                        }}
                        onSubmit={(data) => updateSettings("smtp", data)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSection === "slack" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Slack Integration</CardTitle>
                    <CardDescription>
                      Configure Slack webhook for sending notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings && (
                      <SlackSettingsForm
                        initialData={{
                          enabled: settings["slack.enabled"],
                          hasWebhook: settings["slack.webhookUrl"] !== null,
                        }}
                        onSubmit={(data) => updateSettings("slack", data)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="w-full md:w-56 md:shrink-0">
          <div className="flex gap-1 md:flex-col md:space-y-2">
            <Skeleton className="h-12 w-28 md:w-full rounded-lg" />
            <Skeleton className="h-12 w-28 md:w-full rounded-lg" />
            <Skeleton className="h-12 w-28 md:w-full rounded-lg" />
            <Skeleton className="h-12 w-28 md:w-full rounded-lg" />
          </div>
        </div>
        <div className="flex-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
