"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  KeyRound,
  Boxes,
  Building2,
  Monitor,
  Network,
  Globe,
  Plus,
  X,
} from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
  _count: {
    components: number;
    credentials: number;
  };
}

interface Component {
  id: string;
  serverId: string;
  typeId: string;
  type: {
    id: string;
    name: string;
  };
}

interface ComponentType {
  id: string;
  name: string;
}

interface ServerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Component management state
  const [components, setComponents] = useState<Component[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [isDeletingComponent, setIsDeletingComponent] = useState(false);

  const fetchComponents = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${id}/components`);
      if (res.ok) {
        const data = await res.json();
        setComponents(data);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    }
  }, [id]);

  const fetchComponentTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/entities/componentTypes");
      if (res.ok) {
        const data = await res.json();
        setComponentTypes(data);
      }
    } catch (error) {
      console.error("Failed to fetch component types:", error);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchServer();
    fetchComponents();
    fetchComponentTypes();
  }, [status, id, router, fetchComponents, fetchComponentTypes]);

  const fetchServer = async () => {
    try {
      const res = await fetch(`/api/servers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Server not found");
          router.push("/servers");
          return;
        }
        throw new Error("Failed to fetch server");
      }
      const data = await res.json();
      setServer(data);
    } catch (error) {
      console.error("Failed to fetch server:", error);
      toast.error("Failed to load server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete server");

      toast.success("Server deleted successfully");
      router.push("/servers");
    } catch (error) {
      console.error("Failed to delete server:", error);
      toast.error("Failed to delete server");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddComponent = async () => {
    if (!selectedTypeId) {
      toast.error("Please select a component type");
      return;
    }

    setIsAddingComponent(true);
    try {
      const res = await fetch(`/api/servers/${id}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeId: selectedTypeId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add component");
      }

      toast.success("Component added successfully");
      setSelectedTypeId("");
      fetchComponents();
      // Update server count
      setServer(prev => prev ? {
        ...prev,
        _count: { ...prev._count, components: prev._count.components + 1 }
      } : prev);
    } catch (error) {
      console.error("Failed to add component:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add component");
    } finally {
      setIsAddingComponent(false);
    }
  };

  const handleDeleteComponent = async () => {
    if (!componentToDelete) return;

    setIsDeletingComponent(true);
    try {
      const res = await fetch(
        `/api/servers/${id}/components/${componentToDelete.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete component");

      toast.success("Component removed successfully");
      fetchComponents();
      // Update server count
      setServer(prev => prev ? {
        ...prev,
        _count: { ...prev._count, components: prev._count.components - 1 }
      } : prev);
    } catch (error) {
      console.error("Failed to delete component:", error);
      toast.error("Failed to remove component");
    } finally {
      setIsDeletingComponent(false);
      setComponentToDelete(null);
    }
  };

  // Get available component types (types not already on this server)
  const availableTypes = componentTypes.filter(
    type => !components.some(c => c.typeId === type.id)
  );

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Server Details"
            description="Loading server information..."
          />
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  if (!server) {
    return null;
  }

  const details = [
    { label: "Hostname", value: server.hostname, icon: Globe },
    { label: "IP Address", value: server.ip || "Not set", icon: Network },
    { label: "Operating System", value: server.os?.name || "Not set", icon: Monitor },
    { label: "Role", value: server.role || "Not set", icon: Boxes },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={server.hostname}
          description={server.ip ? `IP: ${server.ip}` : "No IP address set"}
          actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/servers/${id}/edit`}>
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

        {/* Customer & Environment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <Link
                    href={`/customers/${server.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {server.customer.name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Boxes className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Components</p>
                  <p className="font-medium">{server._count.components}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credentials</p>
                  <Link
                    href={`/credentials?serverId=${id}`}
                    className="font-medium hover:underline"
                  >
                    {server._count.credentials}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Details */}
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <CardTitle>Server Details</CardTitle>
            <CardDescription>
              Technical information about this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center gap-4">
                  <div className="rounded-xl bg-muted p-3">
                    <detail.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{detail.label}</p>
                    <p className="font-medium">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {server.environment && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Environment:</span>
                  <Badge variant="outline">{server.environment.name}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Components */}
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Components</CardTitle>
                <CardDescription>
                  Software components installed on this server
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Component */}
            <div className="flex gap-2 mb-6">
              <Select
                value={selectedTypeId}
                onValueChange={setSelectedTypeId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select component type..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All component types added
                    </div>
                  ) : (
                    availableTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddComponent}
                disabled={isAddingComponent || !selectedTypeId}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddingComponent ? "Adding..." : "Add"}
              </Button>
            </div>

            {/* Component List */}
            {components.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Boxes className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No components added yet</p>
                <p className="text-sm">Select a component type above to add one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-background p-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{component.type.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setComponentToDelete(component)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-6">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(server.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(server.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{server.hostname}&quot;? This
              action cannot be undone and will also delete all associated
              components and credentials.
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

      {/* Delete Component Dialog */}
      <AlertDialog
        open={!!componentToDelete}
        onOpenChange={(open) => !open && setComponentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{componentToDelete?.type.name}&quot;
              from this server?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComponent}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComponent}
              disabled={isDeletingComponent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingComponent ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageContainer>
  );
}
