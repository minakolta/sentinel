"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { DataTable, type Column } from "@/components/tables/data-table";
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
import { ServerDialog } from "@/components/dialogs/server-dialog";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

interface Server {
  id: string;
  hostname: string;
  ip: string | null;
  role: string | null;
  customerId: string;
  customer: {
    id: string;
    name: string;
    code: string;
  };
  os: {
    id: string;
    name: string;
  } | null;
  environment: {
    id: string;
    name: string;
  } | null;
  _count: {
    components: number;
    credentials: number;
  };
}

export default function ServersPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editServerId, setEditServerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchServers();
  }, [status, customerId, router]);

  const fetchServers = async () => {
    try {
      const url = customerId
        ? `/api/servers?customerId=${customerId}`
        : "/api/servers";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch servers");
      const data = await res.json();
      setServers(data);
    } catch (error) {
      console.error("Failed to fetch servers:", error);
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete server");

      toast.success("Server deleted successfully");
      setServers(servers.filter((s) => s.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete server:", error);
      toast.error("Failed to delete server");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditServerId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditServerId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchServers();
  };

  const columns: Column<Server>[] = [
    {
      key: "hostname",
      label: "Hostname",
      sortable: true,
      render: (item) => <span className="font-medium">{item.hostname}</span>,
    },
    {
      key: "ip",
      label: "IP Address",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm">{item.ip || "-"}</span>
      ),
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
      key: "environment",
      label: "Environment",
      render: (item) =>
        item.environment ? (
          <Badge variant="outline">{item.environment.name}</Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "os",
      label: "OS",
      render: (item) => item.os?.name || "-",
    },
    {
      key: "role",
      label: "Role",
      render: (item) => item.role || "-",
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Servers"
            description="Manage your infrastructure servers"
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
          title="Servers"
          description={customerId ? "Servers for selected customer" : "Manage your infrastructure servers"}
        />

      <DataTable
          data={servers}
          columns={columns}
          toolbarActions={
            <>
              {customerId && (
                <Button variant="outline" asChild size="sm">
                  <Link href="/servers">View All Servers</Link>
                </Button>
              )}
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </>
          }
          searchKey={(item, query) =>
            item.hostname.toLowerCase().includes(query) ||
            (item.ip?.toLowerCase().includes(query) ?? false) ||
            item.customer.name.toLowerCase().includes(query)
          }
          searchPlaceholder="Search by hostname, IP, or customer..."
          emptyMessage="No servers found. Add your first server to get started."
          onRowClick={(item) => router.push(`/servers/${item.id}`)}
          actions={(item) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/servers/${item.id}`}>
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
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this server? This action cannot be
              undone and will also delete all associated components and
              credentials.
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

      <ServerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serverId={editServerId}
        customerId={customerId || undefined}
        onSuccess={handleDialogSuccess}
      />
      </div>
    </PageContainer>
  );
}
