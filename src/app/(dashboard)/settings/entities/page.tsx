"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LookupTable } from "@/components/tables/lookup-table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PageContainer } from "@/components/layout";
import { Package, Layers, Monitor, Boxes, KeyRound } from "lucide-react";
import type { LookupType } from "@/lib/validations/lookups";

const LOOKUP_CONFIGS: Record<
  LookupType,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    hasOrder?: boolean;
    hasIsJwt?: boolean;
  }
> = {
  products: {
    label: "Products",
    icon: Package,
    description: "Software products that can be licensed.",
  },
  environments: {
    label: "Environments",
    icon: Layers,
    description: "Deployment environments (e.g., SIT, UAT, PROD).",
    hasOrder: true,
  },
  "operating-systems": {
    label: "Operating Systems",
    icon: Monitor,
    description: "Server operating systems.",
  },
  "component-types": {
    label: "Component Types",
    icon: Boxes,
    description: "Types of server components (e.g., Web Server, Database).",
  },
  "license-types": {
    label: "License Types",
    icon: KeyRound,
    description: "Types of licenses (e.g., JWT Token, License File).",
    hasIsJwt: true,
  },
};

type LookupItem = {
  id: string;
  name: string;
  order?: number;
  isJwt?: boolean;
};

export default function ReferenceDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LookupType>("products");
  const [lookups, setLookups] = useState<Record<LookupType, LookupItem[]>>({
    products: [],
    environments: [],
    "operating-systems": [],
    "component-types": [],
    "license-types": [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchAllLookups();
  }, [session, status, router]);

  const fetchAllLookups = async () => {
    setLoading(true);
    try {
      const types: LookupType[] = [
        "products",
        "environments",
        "operating-systems",
        "component-types",
        "license-types",
      ];

      const results = await Promise.all(
        types.map(async (type) => {
          const res = await fetch(`/api/entities/${type}`);
          if (!res.ok) throw new Error(`Failed to fetch ${type}`);
          const data = await res.json();
          return { type, data };
        })
      );

      const newLookups: Record<LookupType, LookupItem[]> = {
        products: [],
        environments: [],
        "operating-systems": [],
        "component-types": [],
        "license-types": [],
      };

      results.forEach(({ type, data }) => {
        newLookups[type] = data;
      });

      setLookups(newLookups);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lookups");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookup = async (type: LookupType) => {
    try {
      const res = await fetch(`/api/entities/${type}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      const data = await res.json();
      setLookups((prev) => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh data");
    }
  };

  const handleCreate = async (type: LookupType, data: { name: string; order?: number; isJwt?: boolean }) => {
    try {
      const res = await fetch(`/api/entities/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }

      toast.success("Item created successfully");
      await fetchLookup(type);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
      throw error;
    }
  };

  const handleUpdate = async (
    type: LookupType,
    id: string,
    data: { name?: string; order?: number; isJwt?: boolean }
  ) => {
    try {
      const res = await fetch(`/api/entities/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Item updated successfully");
      await fetchLookup(type);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
      throw error;
    }
  };

  const handleDelete = async (type: LookupType, id: string) => {
    try {
      const res = await fetch(`/api/entities/${type}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Item deleted successfully");
      await fetchLookup(type);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
      throw error;
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Entities"
            description="Manage configurable dropdown values"
          />
          <ReferenceDataPageSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Entities"
          description="Manage configurable dropdown values"
        />
        <div className="mx-auto max-w-5xl">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as LookupType)}
            className="space-y-6"
          >
            <TabsList>
              {(Object.keys(LOOKUP_CONFIGS) as LookupType[]).map((type) => {
                const config = LOOKUP_CONFIGS[type];
                const Icon = config.icon;
                return (
                  <TabsTrigger key={type} value={type} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

        {(Object.keys(LOOKUP_CONFIGS) as LookupType[]).map((type) => {
          const config = LOOKUP_CONFIGS[type];
          return (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader>
                  <CardTitle>{config.label}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <LookupTable
                    items={lookups[type]}
                    type={type}
                    hasOrder={config.hasOrder}
                    hasIsJwt={config.hasIsJwt}
                    onCreate={(data) => handleCreate(type, data)}
                    onUpdate={(id, data) => handleUpdate(type, id, data)}
                    onDelete={(id) => handleDelete(type, id)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
}

function ReferenceDataPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <Skeleton className="h-10 w-[500px] mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
