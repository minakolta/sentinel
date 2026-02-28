"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerDialog } from "@/components/dialogs/customer-dialog";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  code: string;
  contacts: { name: string; email: string; phone?: string }[] | null;
  projectManagers: { name: string; email: string }[] | null;
  createdAt: string;
  _count: {
    servers: number;
    licenses: number;
    credentials: number;
    firewallRules: number;
  };
}

export default function CustomersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchCustomers();
  }, [status, router]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete customer");

      toast.success("Customer deleted successfully");
      setCustomers(customers.filter((c) => c.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditCustomerId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditCustomerId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchCustomers();
  };

  const columns: Column<Customer>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm font-medium">{item.code}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "contacts",
      label: "Contacts",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.contacts?.length || 0} contact(s)
        </span>
      ),
    },
    {
      key: "servers",
      label: "Servers",
      sortable: true,
      render: (item) => item._count.servers,
    },
    {
      key: "licenses",
      label: "Licenses",
      sortable: true,
      render: (item) => item._count.licenses,
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Customers"
            description="Manage your customer accounts"
          />
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage your customer accounts"
        />

        <DataTable
        data={customers}
        columns={columns}
        searchKey={(item, query) =>
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query)
        }
        searchPlaceholder="Search by name or code..."
        emptyMessage="No customers found. Create your first customer to get started."
        onRowClick={(item) => router.push(`/customers/${item.id}`)}
        toolbarActions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        }
        actions={(item) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/customers/${item.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customers/${item.id}`); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(item.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this customer? This action cannot be
                undone and will also delete all associated servers, licenses,
                credentials, and firewall rules.
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

        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customerId={editCustomerId}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </PageContainer>
  );
}
