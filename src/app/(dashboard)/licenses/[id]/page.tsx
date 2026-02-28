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
import { ExpiryBadge } from "@/components/tables/data-table";
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
  Building2,
  Package,
  Key,
  Layers,
  Calendar,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

interface License {
  id: string;
  customerId: string;
  productId: string;
  typeId: string;
  environmentId: string;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

interface LicenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LicenseDetailPage({ params }: LicenseDetailPageProps) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [loadingValue, setLoadingValue] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchLicense();
  }, [status, id, router]);

  const fetchLicense = async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("License not found");
          router.push("/licenses");
          return;
        }
        throw new Error("Failed to fetch license");
      }
      const data = await res.json();
      setLicense(data);
    } catch (error) {
      console.error("Failed to fetch license:", error);
      toast.error("Failed to load license");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete license");

      toast.success("License deleted successfully");
      router.push("/licenses");
    } catch (error) {
      console.error("Failed to delete license:", error);
      toast.error("Failed to delete license");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleShowValue = async () => {
    if (showValue) {
      setShowValue(false);
      return;
    }

    if (decryptedValue) {
      setShowValue(true);
      return;
    }

    setLoadingValue(true);
    try {
      const res = await fetch(`/api/licenses/${id}/value`);
      if (!res.ok) throw new Error("Failed to fetch license value");
      const data = await res.json();
      setDecryptedValue(data.value);
      setShowValue(true);
    } catch (error) {
      console.error("Failed to fetch license value:", error);
      toast.error("Failed to reveal license value");
    } finally {
      setLoadingValue(false);
    }
  };

  const copyValue = async () => {
    if (!decryptedValue) {
      await toggleShowValue();
    }
    if (decryptedValue) {
      await navigator.clipboard.writeText(decryptedValue);
      toast.success("Copied to clipboard");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="License Details"
            description="Loading license information..."
          />
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  if (!license) {
    return null;
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(license.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={`${license.product.name} License`}
          description={`For ${license.customer.name}`}
          actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/licenses/${id}/edit`}>
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

        {/* Expiry Warning */}
        {daysUntilExpiry <= 30 && (
          <Card className={`rounded-xl ${daysUntilExpiry <= 7 ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-500/5"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Calendar className={`h-8 w-8 ${daysUntilExpiry <= 7 ? "text-destructive" : "text-yellow-500"}`} />
                <div>
                  <p className="font-semibold">
                    {daysUntilExpiry < 0
                      ? daysUntilExpiry === -1
                        ? "This license expired yesterday"
                        : `This license expired ${Math.abs(daysUntilExpiry)} days ago`
                      : daysUntilExpiry === 0
                      ? "This license expires today"
                      : `This license expires in ${daysUntilExpiry} days`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expiration date: {new Date(license.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <Link
                    href={`/customers/${license.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {license.customer.name}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{license.product.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{license.type.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <Badge variant="outline">{license.environment.name}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Value */}
        <Card className="rounded-xl border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>License Value</CardTitle>
                <CardDescription>
                  The encrypted license key or token
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleShowValue}
                  disabled={loadingValue}
                >
                  {loadingValue ? (
                    "Loading..."
                  ) : showValue ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={copyValue}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showValue && decryptedValue ? (
              <pre className="rounded-xl bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {decryptedValue}
              </pre>
            ) : (
              <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                ••••••••••••••••••••••••
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {license.notes && (
          <Card className="rounded-xl border-border/50">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{license.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-6">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(license.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(license.updatedAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Expires:</span>{" "}
                {new Date(license.expiresAt).toLocaleDateString()}
                <span className="ml-2">
                  <ExpiryBadge expiresAt={license.expiresAt} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {license.product.name} license for {license.customer.name}? This action cannot be undone.
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
