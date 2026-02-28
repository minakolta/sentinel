"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { customerFormSchema, type CustomerFormInput } from "@/lib/validations/entities";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface CustomerFormProps {
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Contact {
  name: string;
  email: string;
  phone?: string;
}

interface ProjectManager {
  name: string;
  email: string;
}

export function CustomerForm({ customerId, onSuccess, onCancel }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!customerId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      code: "",
      contacts: [],
      projectManagers: [],
    },
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const {
    fields: pmFields,
    append: appendPM,
    remove: removePM,
  } = useFieldArray({
    control: form.control,
    name: "projectManagers",
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch customer");
      const data = await res.json();

      // Parse JSON strings from API to arrays
      let contacts: Contact[] = [];
      let projectManagers: ProjectManager[] = [];
      try {
        contacts = data.contacts ? JSON.parse(data.contacts) : [];
      } catch {
        contacts = [];
      }
      try {
        projectManagers = data.projectManagers ? JSON.parse(data.projectManagers) : [];
      } catch {
        projectManagers = [];
      }

      form.reset({
        name: data.name,
        code: data.code,
        contacts,
        projectManagers,
      });
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      toast.error("Failed to load customer");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/customers");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormInput) => {
    setIsSubmitting(true);
    try {
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
      const method = customerId ? "PUT" : "POST";

      // Convert arrays to JSON strings for API
      const payload = {
        name: data.name,
        code: data.code,
        contacts: data.contacts && data.contacts.length > 0 ? JSON.stringify(data.contacts) : null,
        projectManagers: data.projectManagers && data.projectManagers.length > 0 ? JSON.stringify(data.projectManagers) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save customer");
      }

      toast.success(customerId ? "Customer updated" : "Customer created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/customers");
      }
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save customer");
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
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the customer&apos;s name and unique identifier code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ACME"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    A short, unique identifier (e.g., ACME, CORP01)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Add contact persons for this customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`contacts.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`contacts.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
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
                    name={`contacts.${index}.phone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => appendContact({ name: "", email: "", phone: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle>Project Managers</CardTitle>
            <CardDescription>
              Add project managers responsible for this customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pmFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Project Manager {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePM(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`projectManagers.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`projectManagers.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="jane@example.com"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => appendPM({ name: "", email: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project Manager
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel ? onCancel() : router.push("/customers")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {customerId ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
