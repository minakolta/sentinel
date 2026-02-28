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
import { FirewallRuleDialog } from "@/components/dialogs/firewall-rule-dialog";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

interface FirewallRule {
  id: string;
  customerId: string;
  srcRole: string | null;
  srcIp: string;
  dstRole: string | null;
  dstIp: string;
  port: number;
  protocol: string;
  comment: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
}

export default function FirewallRulesPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRuleId, setEditRuleId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchRules();
  }, [status, customerId, router]);

  const fetchRules = async () => {
    try {
      const url = customerId
        ? `/api/firewall-rules?customerId=${customerId}`
        : "/api/firewall-rules";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch firewall rules");
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to fetch firewall rules:", error);
      toast.error("Failed to load firewall rules");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/firewall-rules/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete firewall rule");

      toast.success("Firewall rule deleted successfully");
      setRules(rules.filter((r) => r.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete firewall rule:", error);
      toast.error("Failed to delete firewall rule");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditRuleId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditRuleId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchRules();
  };

  const columns: Column<FirewallRule>[] = [
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
      key: "srcIp",
      label: "Source",
      render: (item) => (
        <div className="text-sm">
          {item.srcRole && (
            <span className="text-muted-foreground">{item.srcRole}: </span>
          )}
          <span className="font-mono">{item.srcIp}</span>
        </div>
      ),
    },
    {
      key: "dstIp",
      label: "Destination",
      render: (item) => (
        <div className="text-sm">
          {item.dstRole && (
            <span className="text-muted-foreground">{item.dstRole}: </span>
          )}
          <span className="font-mono">{item.dstIp}</span>
        </div>
      ),
    },
    {
      key: "port",
      label: "Port",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm">{item.port}</span>
      ),
    },
    {
      key: "protocol",
      label: "Protocol",
      render: (item) => (
        <Badge variant="outline">{item.protocol}</Badge>
      ),
    },
    {
      key: "comment",
      label: "Comment",
      render: (item) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {item.comment || "-"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Firewall Rules"
            description="Manage firewall rule configurations"
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
          title="Firewall Rules"
          description={customerId ? "Firewall rules for selected customer" : "Manage firewall rule configurations"}
        />

      <DataTable
          data={rules}
          columns={columns}
          toolbarActions={
            <>
              {customerId && (
                <Button variant="outline" asChild size="sm">
                  <Link href="/firewall-rules">View All Rules</Link>
                </Button>
              )}
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </>
          }
          searchKey={(item, query) =>
            item.customer.name.toLowerCase().includes(query) ||
            item.srcIp.toLowerCase().includes(query) ||
            item.dstIp.toLowerCase().includes(query) ||
            (item.comment?.toLowerCase().includes(query) ?? false)
          }
          searchPlaceholder="Search by customer, IP, or comment..."
          emptyMessage="No firewall rules found. Add your first rule to get started."
          onRowClick={(item) => router.push(`/firewall-rules/${item.id}`)}
          actions={(item) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/firewall-rules/${item.id}`}>
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
            <AlertDialogTitle>Delete Firewall Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this firewall rule? This action cannot be
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

      <FirewallRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ruleId={editRuleId}
        customerId={customerId || undefined}
        onSuccess={handleDialogSuccess}
      />
      </div>
    </PageContainer>
  );
}
