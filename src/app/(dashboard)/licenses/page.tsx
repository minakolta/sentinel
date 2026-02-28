"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { DataTable, ExpiryBadge, type Column } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { LicenseDialog } from "@/components/dialogs/license-dialog";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

interface License {
  id: string;
  customerId: string;
  productId: string;
  typeId: string;
  environmentId: string;
  expiresAt: string;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
  product: {
    id: string;
    name: string;
  };
  type: {
    id: string;
    name: string;
    isJwt: boolean;
  };
  environment: {
    id: string;
    name: string;
  };
}

export default function LicensesPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLicenseId, setEditLicenseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchLicenses();
  }, [status, customerId, router]);

  const fetchLicenses = async () => {
    try {
      const url = customerId
        ? `/api/licenses?customerId=${customerId}`
        : "/api/licenses";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch licenses");
      const data = await res.json();
      setLicenses(data);
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
      toast.error("Failed to load licenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/licenses/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete license");

      toast.success("License deleted successfully");
      setLicenses(licenses.filter((l) => l.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete license:", error);
      toast.error("Failed to delete license");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditLicenseId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditLicenseId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchLicenses();
  };

  const columns: Column<License>[] = [
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (item) => (
        <Link
          href={`/customers/${item.customer.id}`}
          className="hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {item.customer.name}
        </Link>
      ),
    },
    {
      key: "product",
      label: "Product",
      sortable: true,
      render: (item) => item.product.name,
    },
    {
      key: "type",
      label: "Type",
      render: (item) => (
        <Badge variant="outline">{item.type.name}</Badge>
      ),
    },
    {
      key: "environment",
      label: "Environment",
      render: (item) => (
        <Badge variant="secondary">{item.environment.name}</Badge>
      ),
    },
    {
      key: "expiresAt",
      label: "Expires",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {new Date(item.expiresAt).toLocaleDateString()}
          </span>
          <ExpiryBadge expiresAt={item.expiresAt} />
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Licenses"
            description="Manage software licenses and track expiration"
          />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Licenses"
          description={customerId ? "Licenses for selected customer" : "Manage software licenses and track expiration"}
        />

      <DataTable
          data={licenses}
          columns={columns}
          toolbarActions={
            <>
              {customerId && (
                <Button variant="outline" asChild size="sm">
                  <Link href="/licenses">View All Licenses</Link>
                </Button>
              )}
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </>
          }
          searchKey={(item, query) =>
            item.customer.name.toLowerCase().includes(query) ||
            item.product.name.toLowerCase().includes(query)
          }
          searchPlaceholder="Search by customer or product..."
          emptyMessage="No licenses found. Add your first license to get started."
          onRowClick={(item) => router.push(`/licenses/${item.id}`)}
          actions={(item) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/licenses/${item.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
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
            <AlertDialogTitle>Delete License</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this license? This action cannot be
              undone.
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

      <LicenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        licenseId={editLicenseId}
        customerId={customerId || undefined}
        onSuccess={handleDialogSuccess}
      />
      </div>
    </PageContainer>
  );
}
