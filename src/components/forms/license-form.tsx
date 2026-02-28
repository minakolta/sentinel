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
import { licenseSchema, type LicenseInput } from "@/lib/validations/entities";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Attempts to parse a JWT token and extract the expiration date
 */
function extractJwtExpiration(token: string): Date | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    if (!payload) return null;
    
    // Handle base64url encoding (replace - with +, _ with /)
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Pad with = if needed
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const json = JSON.parse(decoded);

    // Check for exp claim (Unix timestamp in seconds)
    if (json.exp && typeof json.exp === "number") {
      return new Date(json.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface LookupItem {
  id: string;
  name: string;
  isJwt?: boolean;
}

interface LicenseFormProps {
  licenseId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LicenseForm({ licenseId, customerId: propCustomerId, onSuccess, onCancel }: LicenseFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = propCustomerId || searchParams.get("customerId");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<LookupItem[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LookupItem[]>([]);
  const [environments, setEnvironments] = useState<LookupItem[]>([]);
  const [selectedType, setSelectedType] = useState<LookupItem | null>(null);
  const [jwtExpExtracted, setJwtExpExtracted] = useState(false);

  const form = useForm<LicenseInput>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      customerId: initialCustomerId || "",
      productId: "",
      typeId: "",
      environmentId: "",
      value: "",
      expiresAt: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (licenseId) {
      fetchLicense();
    }
  }, [licenseId]);

  // Watch for JWT value changes and extract expiration date
  const watchedValue = form.watch("value");
  useEffect(() => {
    if (!selectedType?.isJwt || !watchedValue) {
      setJwtExpExtracted(false);
      return;
    }

    const expDate = extractJwtExpiration(watchedValue);
    if (expDate) {
      form.setValue("expiresAt", expDate);
      setJwtExpExtracted(true);
    } else {
      setJwtExpExtracted(false);
    }
  }, [watchedValue, selectedType, form]);

  const fetchLookups = async () => {
    try {
      const [customersRes, productsRes, typesRes, envRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/entities/products"),
        fetch("/api/entities/license-types"),
        fetch("/api/entities/environments"),
      ]);

      if (!customersRes.ok || !productsRes.ok || !typesRes.ok || !envRes.ok) {
        throw new Error("Failed to fetch lookups");
      }

      const [customersData, productsData, typesData, envData] = await Promise.all([
        customersRes.json(),
        productsRes.json(),
        typesRes.json(),
        envRes.json(),
      ]);

      setCustomers(customersData);
      setProducts(productsData);
      setLicenseTypes(typesData);
      setEnvironments(envData);
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
      toast.error("Failed to load form data");
    } finally {
      if (!licenseId) {
        setLoading(false);
      }
    }
  };

  const fetchLicense = async () => {
    try {
      const res = await fetch(`/api/licenses/${licenseId}`);
      if (!res.ok) throw new Error("Failed to fetch license");
      const data = await res.json();

      form.reset({
        customerId: data.customerId,
        productId: data.productId,
        typeId: data.typeId,
        environmentId: data.environmentId,
        value: "", // Don't pre-fill encrypted value
        expiresAt: new Date(data.expiresAt).toISOString().split("T")[0],
        notes: data.notes || "",
      });

      // Set selected type for JWT warning display
      if (data.type) {
        setSelectedType(data.type);
      }
    } catch (error) {
      console.error("Failed to fetch license:", error);
      toast.error("Failed to load license");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/licenses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = licenseTypes.find((t) => t.id === typeId);
    setSelectedType(type || null);
    form.setValue("typeId", typeId);
  };

  const onSubmit = async (data: LicenseInput) => {
    setIsSubmitting(true);
    try {
      const url = licenseId ? `/api/licenses/${licenseId}` : "/api/licenses";
      const method = licenseId ? "PUT" : "POST";

      // Don't send empty value for updates unless it's being changed
      const submitData = { ...data };
      if (licenseId && !data.value) {
        delete (submitData as Partial<LicenseInput>).value;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save license");
      }

      toast.success(licenseId ? "License updated" : "License created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/licenses");
      }
    } catch (error) {
      console.error("Failed to save license:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save license");
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
            <CardTitle>License Information</CardTitle>
            <CardDescription>
              Configure the license details and expiration.
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
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
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
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type</FormLabel>
                    <Select onValueChange={handleTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {licenseTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Environment</FormLabel>
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
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Expiration Date
                      {jwtExpExtracted && (
                        <span className="text-xs font-normal text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          from JWT
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select expiration date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle>License Value</CardTitle>
            <CardDescription>
              Enter the license key, token, or file content. This will be encrypted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedType?.isJwt && (
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${
                jwtExpExtracted 
                  ? "border-green-500/50 bg-green-500/10" 
                  : "border-yellow-500/50 bg-yellow-500/10"
              }`}>
                {jwtExpExtracted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className={`font-medium ${jwtExpExtracted ? "text-green-600" : "text-yellow-600"}`}>
                    {jwtExpExtracted ? "JWT Expiration Extracted" : "JWT Token Type"}
                  </p>
                  <p className="text-muted-foreground">
                    {jwtExpExtracted 
                      ? "The expiration date has been automatically set from the JWT token."
                      : "Paste a JWT token to automatically extract the expiration date."
                    }
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    License Value {licenseId && "(leave empty to keep current)"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter license key, JWT token, or license file content..."
                      className="font-mono text-sm min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The value will be encrypted and stored securely.
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
                      placeholder="Any additional notes about this license..."
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
            onClick={() => onCancel ? onCancel() : router.push("/licenses")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {licenseId ? "Update License" : "Create License"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
