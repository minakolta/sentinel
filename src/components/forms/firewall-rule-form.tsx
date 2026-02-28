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
import { firewallRuleSchema, type FirewallRuleInput } from "@/lib/validations/entities";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface FirewallRuleFormProps {
  ruleId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FirewallRuleForm({
  ruleId,
  customerId: propCustomerId,
  onSuccess,
  onCancel,
}: FirewallRuleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = propCustomerId || searchParams.get("customerId") || "";
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const form = useForm<FirewallRuleInput>({
    resolver: zodResolver(firewallRuleSchema),
    defaultValues: {
      customerId: initialCustomerId,
      srcRole: null,
      srcIp: "",
      dstRole: null,
      dstIp: "",
      port: 443,
      protocol: "TCP" as const,
      comment: null,
    },
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (ruleId) {
      fetchRule();
    }
  }, [ruleId]);

  const fetchLookups = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
      toast.error("Failed to load form data");
    } finally {
      if (!ruleId) {
        setLoading(false);
      }
    }
  };

  const fetchRule = async () => {
    try {
      const res = await fetch(`/api/firewall-rules/${ruleId}`);
      if (!res.ok) throw new Error("Failed to fetch firewall rule");
      const data = await res.json();

      form.reset({
        customerId: data.customerId,
        srcRole: data.srcRole || null,
        srcIp: data.srcIp,
        dstRole: data.dstRole || null,
        dstIp: data.dstIp,
        port: data.port,
        protocol: data.protocol as "TCP" | "UDP",
        comment: data.comment || null,
      });
    } catch (error) {
      console.error("Failed to fetch firewall rule:", error);
      toast.error("Failed to load firewall rule");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/firewall-rules");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FirewallRuleInput) => {
    setIsSubmitting(true);
    try {
      const url = ruleId ? `/api/firewall-rules/${ruleId}` : "/api/firewall-rules";
      const method = ruleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save firewall rule");
      }

      toast.success(ruleId ? "Firewall rule updated" : "Firewall rule created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/firewall-rules");
      }
    } catch (error) {
      console.error("Failed to save firewall rule:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save firewall rule"
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
            <CardTitle>Firewall Rule</CardTitle>
            <CardDescription>
              Define source and destination for the firewall rule.
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
                name="srcRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Role (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Web Server"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="srcIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source IP</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.0.0/24" {...field} />
                    </FormControl>
                    <FormDescription>IP address or CIDR notation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dstRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Role (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Database Server"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dstIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination IP</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.1.0/24" {...field} />
                    </FormControl>
                    <FormDescription>IP address or CIDR notation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this rule..."
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
            onClick={() =>
              onCancel ? onCancel() : router.push("/firewall-rules")
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {ruleId ? "Update Rule" : "Create Rule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
