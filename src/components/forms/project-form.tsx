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
import { projectSchema, type ProjectInput } from "@/lib/validations/entities";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectFormProps {
  projectId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ projectId, customerId: propCustomerId, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = propCustomerId || searchParams.get("customerId");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      customerId: initialCustomerId || "",
      ownerId: "",
    },
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchLookups = async () => {
    try {
      const [customersRes, usersRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/users"),
      ]);

      if (!customersRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch lookups");
      }

      const [customersData, usersData] = await Promise.all([
        customersRes.json(),
        usersRes.json(),
      ]);

      setCustomers(customersData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
      toast.error("Failed to load form data");
    } finally {
      if (!projectId) {
        setLoading(false);
      }
    }
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();

      form.reset({
        name: data.name,
        description: data.description || "",
        customerId: data.customerId,
        ownerId: data.ownerId || "",
      });
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast.error("Failed to load project");
      if (onCancel) {
        onCancel();
      } else {
        router.push("/projects");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectInput) => {
    setIsSubmitting(true);
    try {
      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = projectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ownerId: data.ownerId || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save project");
      }

      toast.success(projectId ? "Project updated" : "Project created");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projectId ? "Edit Project" : "Project Details"}</CardTitle>
        <CardDescription>
          {projectId
            ? "Update the project information below"
            : "Enter the details for the new project"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormDescription>
                    The customer this project belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cloud Migration Phase 1" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the project scope and objectives..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__NONE__" ? null : v)}
                    value={field.value || "__NONE__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an owner (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__NONE__">No owner</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The user responsible for this project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onCancel ? onCancel() : router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {projectId ? "Update" : "Create"} Project
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
