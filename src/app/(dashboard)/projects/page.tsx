"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ProjectDialog } from "@/components/dialogs/project-dialog";
import { Plus, MoreHorizontal, Pencil, Trash2, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  customerId: string;
  ownerId: string | null;
  customer: {
    id: string;
    name: string;
    code: string;
  };
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchProjects();
  }, [status, customerId, router]);

  const fetchProjects = async () => {
    try {
      const url = customerId
        ? `/api/projects?customerId=${customerId}`
        : "/api/projects";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete project");

      toast.success("Project deleted successfully");
      setProjects(projects.filter((p) => p.id !== deleteId));
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreateDialog = () => {
    setEditProjectId(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    setEditProjectId(id);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchProjects();
  };

  const columns: Column<Project>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{item.name}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.customer.name}</div>
          <div className="text-xs text-muted-foreground">{item.customer.code}</div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (item) =>
        item.owner ? (
          <div>
            <div className="font-medium">{item.owner.name || "—"}</div>
            <div className="text-xs text-muted-foreground">{item.owner.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">No owner</span>
        ),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Projects"
            description="Manage projects across customers"
          />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Manage projects across customers"
        />
        <DataTable
          data={projects}
          columns={columns}
          searchKey={(item, query) =>
            item.name.toLowerCase().includes(query) ||
            item.customer.name.toLowerCase().includes(query) ||
            item.customer.code.toLowerCase().includes(query)
          }
          searchPlaceholder="Search by name or customer..."
          emptyMessage="No projects found. Create your first project to get started."
          onRowClick={(item) => openEditDialog(item.id)}
          toolbarActions={
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
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
                <DropdownMenuItem onClick={() => openEditDialog(item.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteId(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
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

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={editProjectId}
        customerId={customerId || undefined}
        onSuccess={handleDialogSuccess}
      />
    </PageContainer>
  );
}
