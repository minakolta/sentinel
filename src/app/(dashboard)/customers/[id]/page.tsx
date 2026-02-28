"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  Server,
  Key,
  KeyRound,
  Shield,
  Mail,
  Phone,
  User,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
  contacts: { name: string; email: string; phone?: string }[] | null;
  projectManagers: { name: string; email: string }[] | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    servers: number;
    licenses: number;
    credentials: number;
    firewallRules: number;
  };
}

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchCustomer();
  }, [status, id, router]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Customer not found");
          router.push("/customers");
          return;
        }
        throw new Error("Failed to fetch customer");
      }
      const data = await res.json();
      // Parse JSON strings for contacts and projectManagers
      setCustomer({
        ...data,
        contacts: data.contacts ? (typeof data.contacts === 'string' ? JSON.parse(data.contacts) : data.contacts) : [],
        projectManagers: data.projectManagers ? (typeof data.projectManagers === 'string' ? JSON.parse(data.projectManagers) : data.projectManagers) : [],
      });
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      toast.error("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete customer");

      toast.success("Customer deleted successfully");
      router.push("/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Customer Details"
            description="Loading customer information..."
          />
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return null;
  }

  const stats = [
    { label: "Servers", value: customer._count.servers, icon: Server, href: `/servers?customerId=${id}` },
    { label: "Licenses", value: customer._count.licenses, icon: Key, href: `/licenses?customerId=${id}` },
    { label: "Credentials", value: customer._count.credentials, icon: KeyRound, href: `/credentials?customerId=${id}` },
    { label: "Firewall Rules", value: customer._count.firewallRules, icon: Shield, href: `/firewall-rules?customerId=${id}` },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={customer.name}
          description={`Customer Code: ${customer.code}`}
          actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/customers/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        }
      />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-xl border-border/50 hover:border-border transition-colors">
              <Link href={stat.href}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-muted p-3">
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Details */}
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="project-managers">Project Managers</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>
                  Contact persons for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!customer.contacts || customer.contacts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No contacts added yet.{" "}
                    <Link href={`/customers/${id}/edit`} className="underline">
                      Add contacts
                    </Link>
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {customer.contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="rounded-xl border bg-muted/30 p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contact.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${contact.phone}`} className="hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="project-managers">
            <Card className="rounded-xl border-border/50">
              <CardHeader>
                <CardTitle>Project Managers</CardTitle>
                <CardDescription>
                  Internal project managers responsible for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!customer.projectManagers || customer.projectManagers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No project managers assigned yet.{" "}
                    <Link href={`/customers/${id}/edit`} className="underline">
                      Add project managers
                    </Link>
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {customer.projectManagers.map((pm, index) => (
                      <div
                        key={index}
                        className="rounded-xl border bg-muted/30 p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{pm.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${pm.email}`} className="hover:underline">
                            {pm.email}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Metadata */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-6">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(customer.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(customer.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{customer.name}&quot;? This
              action cannot be undone and will also delete all associated
              servers, licenses, credentials, and firewall rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageContainer>
  );
}
