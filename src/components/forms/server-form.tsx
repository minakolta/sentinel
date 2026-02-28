"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { serverSchema, type ServerInput } from "@/lib/validations/entities";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface LookupItem {
  id: string;
  name: string;
}

interface ServerFormProps {
  serverId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServerForm({ serverId, customerId: propCustomerId, onSuccess, onCancel }: ServerFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = propCustomerId || searchParams.get("customerId");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<LookupItem[]>([]);
  const [environments, setEnvironments] = useState<LookupItem[]>([]);

  const form = useForm<ServerInput>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      hostname: "",
      ip: "",
      role: "",
      customerId: initialCustomerId || "",
      osId: "",
      environmentId: "",
    },
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (serverId) {
      fetchServer();
    }
  }, [serverId]);

  const fetchLookups = async () => {
    try {
      const [customersRes, osRes, envRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/entities/operating-systems"),
        fetch("/api/entities/environments"),
      ]);

      if (!customersRes.ok || !osRes.ok || !envRes.ok) {
        throw new Error("Failed to fetch lookups");
      }

      const [customersData, osData, envData] = await Promise.all([
        customersRes.json(),
        osRes.json(),
        envRes.json(),
      ]);

      setCustomers(customersData);
      setOperatingSystems(osData);
      setEnvironments(envData);
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
      toast.error("Failed to load form data");
    } finally {
      if (!serverId) {
        setLoading(false);
      }
    }
  };

  const fetchServer = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}`);
      if (!res.ok) throw new Error("Failed to fetch server");
      const data = await res.json();

      form.reset({
        hostname: data.hostname,
        ip: data.ip || "",
        role: data.role || "",
        customerId: data.customerId,
        osId: data.osId || "",
        environmentId: data.environmentId || "",
      });
    } catch (error) {
      console.error("Failed to fetch server:", error);
      toast.error("Failed to load server");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/servers");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ServerInput) => {
    setIsSubmitting(true);
    try {
      const url = serverId ? `/api/servers/${serverId}` : "/api/servers";
      const method = serverId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save server");
      }

      toast.success(serverId ? "Server updated" : "Server created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/servers");
      }
    } catch (error) {
      console.error("Failed to save server:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save server");
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
            <CardTitle>Server Information</CardTitle>
            <CardDescription>
              Enter the server&apos;s hostname and network details.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hostname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostname</FormLabel>
                    <FormControl>
                      <Input placeholder="server-01.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="environmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {environments.map((env) => (
                          <SelectItem key={env.id} value={env.id}>
                            {env.name}
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
                name="osId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating System (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select OS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operatingSystems.map((os) => (
                          <SelectItem key={os.id} value={os.id}>
                            {os.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Role (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Web Server, Database Server" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Describe the server&apos;s primary function
                  </FormDescription>
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
            onClick={() => onCancel ? onCancel() : router.push("/servers")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {serverId ? "Update Server" : "Create Server"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
