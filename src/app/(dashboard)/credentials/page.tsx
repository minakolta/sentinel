"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { CredentialDialog } from "@/components/dialogs/credential-dialog";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Copy } from "lucide-react";

interface Credential {
  id: string;
  customerId: string;
  serverId: string | null;
  username: string;
  url: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
  server: {
    id: string;
    hostname: string;
  } | null;
}

export default function CredentialsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCredentialId, setEditCredentialId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchCredentials();
  }, [status, customerId, router]);

  const fetchCredentials = async () => {
    try {
      const url = customerId
        ? `/api/credentials?customerId=${customerId}`
        : "/api/credentials";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch credentials");
      const data = await res.json();
      setCredentials(data);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/credentials/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete credential");

      toast.success("Credential deleted successfully");
      setCredentials(credentials.filter((c) => c.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete credential:", error);
      toast.error("Failed to delete credential");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditCredentialId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditCredentialId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchCredentials();
  };

  const copySecret = async (id: string) => {
    try {
      const res = await fetch(`/api/credentials/${id}/secret`);
      if (!res.ok) throw new Error("Failed to get secret");
      const data = await res.json();
      await navigator.clipboard.writeText(data.secret);
      toast.success("Password copied to clipboard");
    } catch (error) {
      console.error("Failed to copy secret:", error);
      toast.error("Failed to copy password");
    }
  };

  const columns: Column<Credential>[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (item) => <span className="font-mono text-sm">{item.username}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (item) => (
        <Link
          href={`/customers/${item.customer.id}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {item.customer.name}
        </Link>
      ),
    },
    {
      key: "server",
      label: "Server",
      render: (item) =>
        item.server ? (
          <Link
            href={`/servers/${item.server.id}`}
            className="hover:underline font-mono text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {item.server.hostname}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "url",
      label: "URL",
      render: (item) =>
        item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-sm text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {item.url}
          </a>
        ) : (
          "-"
        ),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Credentials"
            description="Manage stored credentials securely"
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
          title="Credentials"
          description={customerId ? "Credentials for selected customer" : "Manage stored credentials securely"}
        />

      <DataTable
          data={credentials}
          columns={columns}
          toolbarActions={
            <>
              {customerId && (
                <Button variant="outline" asChild size="sm">
                  <Link href="/credentials">View All Credentials</Link>
                </Button>
              )}
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </>
          }
          searchKey={(item, query) =>
            item.username.toLowerCase().includes(query) ||
            item.customer.name.toLowerCase().includes(query) ||
            (item.server?.hostname.toLowerCase().includes(query) ?? false)
          }
          searchPlaceholder="Search by username, customer, or server..."
          emptyMessage="No credentials found. Add your first credential to get started."
          onRowClick={(item) => router.push(`/credentials/${item.id}`)}
          actions={(item) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => copySecret(item.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Password
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/credentials/${item.id}`}>
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
            <AlertDialogTitle>Delete Credential</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credential? This action cannot be
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

      <CredentialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        credentialId={editCredentialId}
        customerId={customerId || undefined}
        onSuccess={handleDialogSuccess}
      />
      </div>
    </PageContainer>
  );
}
