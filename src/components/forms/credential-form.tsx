"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { credentialSchema, type CredentialInput } from "@/lib/validations/entities";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface Server {
  id: string;
  hostname: string;
  customerId: string;
}

interface CredentialFormProps {
  credentialId?: string;
  customerId?: string;
  serverId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CredentialForm({
  credentialId,
  customerId: propCustomerId,
  serverId: propServerId,
  onSuccess,
  onCancel,
}: CredentialFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = propCustomerId || searchParams.get("customerId") || "";
  const initialServerId = propServerId || searchParams.get("serverId") || "";
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [showSecret, setShowSecret] = useState(false);

  const form = useForm<CredentialInput>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      customerId: initialCustomerId,
      serverId: initialServerId || null,
      username: "",
      secret: "",
      url: "",
      notes: "",
    },
  });

  const selectedCustomerId = form.watch("customerId");

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (credentialId) {
      fetchCredential();
    }
  }, [credentialId]);

  // Filter servers by selected customer
  const filteredServers = servers.filter(
    (s) => !selectedCustomerId || s.customerId === selectedCustomerId
  );

  const fetchLookups = async () => {
    try {
      const [customersRes, serversRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/servers"),
      ]);

      if (!customersRes.ok || !serversRes.ok) {
        throw new Error("Failed to fetch lookups");
      }

      const [customersData, serversData] = await Promise.all([
        customersRes.json(),
        serversRes.json(),
      ]);

      setCustomers(customersData);
      setServers(serversData);
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
      toast.error("Failed to load form data");
    } finally {
      if (!credentialId) {
        setLoading(false);
      }
    }
  };

  const fetchCredential = async () => {
    try {
      const res = await fetch(`/api/credentials/${credentialId}`);
      if (!res.ok) throw new Error("Failed to fetch credential");
      const data = await res.json();

      form.reset({
        customerId: data.customerId,
        serverId: data.serverId,
        username: data.username,
        secret: "", // Don't pre-fill encrypted secret
        url: data.url || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Failed to fetch credential:", error);
      toast.error("Failed to load credential");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CredentialInput) => {
    setIsSubmitting(true);
    try {
      const url = credentialId
        ? `/api/credentials/${credentialId}`
        : "/api/credentials";
      const method = credentialId ? "PUT" : "POST";

      // Don't send empty secret for updates unless it's being changed
      const submitData = { ...data };
      if (credentialId && !data.secret) {
        delete (submitData as Partial<CredentialInput>).secret;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save credential");
      }

      toast.success(credentialId ? "Credential updated" : "Credential created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/credentials");
      }
    } catch (error) {
      console.error("Failed to save credential:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save credential"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle>Credential Information</CardTitle>
            <CardDescription>
              Store credentials securely with encryption.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server (optional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__NONE__" ? null : v)}
                    value={field.value || "__NONE__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a server (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__NONE__">No server</SelectItem>
                      {filteredServers.map((server) => (
                        <SelectItem key={server.id} value={server.id}>
                          {server.hostname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Associate this credential with a specific server
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password/Secret{credentialId && " (leave blank to keep current)"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showSecret ? "text" : "password"}
                        placeholder={credentialId ? "••••••••" : "Enter password"}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://admin.example.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Login URL for this credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => (onCancel ? onCancel() : router.push("/credentials"))}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {credentialId ? "Update Credential" : "Create Credential"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
