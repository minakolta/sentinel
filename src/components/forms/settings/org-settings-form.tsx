"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgSettingsSchema, type OrgSettings } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { X, Plus, Loader2, Upload, ImageIcon } from "lucide-react";
import { useBranding } from "@/lib/branding";

interface OrgSettingsFormProps {
  initialData: OrgSettings;
  onSubmit: (data: OrgSettings) => Promise<void>;
}

export function OrgSettingsForm({ initialData, onSubmit }: OrgSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domains, setDomains] = useState<string[]>(initialData.allowedDomains || []);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const branding = useBranding();

  const form = useForm<OrgSettings>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      name: initialData.name,
      allowedDomains: domains,
      logo: initialData.logo || "",
    },
  });

  const addDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(domain)) {
      return;
    }

    if (!domains.includes(domain)) {
      const updated = [...domains, domain];
      setDomains(updated);
      form.setValue("allowedDomains", updated);
    }
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    setDomains(updated);
    form.setValue("allowedDomains", updated);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      form.setValue("logo", result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue("logo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (data: OrgSettings) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, allowedDomains: domains });
      // Refresh branding after successful save
      await branding.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Organization Logo</h4>
            <p className="text-sm text-muted-foreground">
              Upload a logo to display in the sidebar and emails.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/25">
              {logoPreview ? (
                <AvatarImage src={logoPreview} alt="Logo" className="object-cover" />
              ) : (
                <AvatarFallback className="rounded-xl bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or SVG. Max 512KB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        <Separator />

        {/* Organization Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="My Company" className="max-w-md" {...field} />
              </FormControl>
              <FormDescription>
                This name will be displayed in the sidebar header.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Allowed Domains */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Allowed Email Domains</h4>
            <p className="text-sm text-muted-foreground">
              Only users with these email domains can sign in.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Input
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDomain();
                }
              }}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={addDomain}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {domains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  {domain}
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              No domains configured. All sign-in attempts will be allowed.
            </p>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
