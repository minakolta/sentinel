"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, RefreshCw, Eye, Plus, Pencil, Trash2 } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

const ENTITY_TYPES = [
  "All",
  "Customer",
  "Project",
  "Server",
  "License",
  "Credential",
  "FirewallRule",
  "Product",
  "Environment",
  "OperatingSystem",
  "ComponentType",
  "LicenseType",
];

const ACTION_TYPES = ["All", "CREATE", "UPDATE", "DELETE"];

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [entityFilter, setEntityFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      toast.error("Access denied. Admin role required.");
      return;
    }
    fetchLogs();
  }, [status, session, router]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (entityFilter !== "All") params.set("entity", entityFilter);
      if (actionFilter !== "All") params.set("action", actionFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", "100");

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      // Ensure data is an array
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleApplyFilters = () => {
    setLoading(true);
    fetchLogs();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus className="h-4 w-4" />;
      case "UPDATE":
        return <Pencil className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" => {
    switch (action) {
      case "CREATE":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      default:
        return "default";
    }
  };

  const renderDiff = (before: Record<string, unknown> | null, after: Record<string, unknown> | null) => {
    if (!before && !after) return null;

    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    // Filter out internal/system fields
    const ignoredKeys = ["id", "createdAt", "updatedAt", "encryptedValue", "encryptedSecret"];
    const relevantKeys = Array.from(allKeys).filter((key) => !ignoredKeys.includes(key));

    return (
      <div className="space-y-2 text-sm">
        {relevantKeys.map((key) => {
          const beforeValue = before?.[key];
          const afterValue = after?.[key];
          const hasChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);

          if (!hasChanged && before && after) return null;

          return (
            <div key={key} className="grid grid-cols-3 gap-2 py-1 border-b border-border/50 last:border-0">
              <div className="font-medium text-muted-foreground">{key}</div>
              {before && (
                <div className={`font-mono ${hasChanged ? "text-red-600 line-through" : ""}`}>
                  {JSON.stringify(beforeValue) ?? "-"}
                </div>
              )}
              {after && (
                <div className={`font-mono ${hasChanged ? "text-green-600" : ""}`}>
                  {JSON.stringify(afterValue) ?? "-"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Audit Logs"
            description="Track all changes made to the system"
          />
          <Skeleton className="h-20" />
          <Skeleton className="h-[500px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Track all changes made to the system"
        />

      {/* Filters */}
        <Card className="rounded-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DatePicker
                value={startDate ? new Date(startDate) : undefined}
                onChange={(date: Date | undefined) => {
                  setStartDate(date ? date.toISOString().split('T')[0] ?? "" : "");
                }}
                placeholder="Start Date"
              />

              <DatePicker
                value={endDate ? new Date(endDate) : undefined}
                onChange={(date: Date | undefined) => {
                  setEndDate(date ? date.toISOString().split('T')[0] ?? "" : "");
                }}
                placeholder="End Date"
              />

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Apply
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No audit logs found matching the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.entity}</div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {log.entityId.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground text-center">
          Showing {logs.length} logs (max 100)
        </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={getActionBadgeVariant(selectedLog?.action || "")}>
                {selectedLog?.action}
              </Badge>
              {selectedLog?.entity}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.timestamp).toLocaleString()} by{" "}
              {selectedLog?.user?.name || "Unknown User"}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entity ID:</span>
                  <span className="ml-2 font-mono">{selectedLog.entityId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="ml-2 font-mono">{selectedLog.userId}</span>
                </div>
              </div>

              {selectedLog.action === "CREATE" && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Created Record</h4>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    {renderDiff(null, selectedLog.after)}
                  </div>
                </div>
              )}

              {selectedLog.action === "UPDATE" && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Changes</h4>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="grid grid-cols-3 gap-2 pb-2 mb-2 border-b font-medium text-xs text-muted-foreground">
                      <div>Field</div>
                      <div>Before</div>
                      <div>After</div>
                    </div>
                    {renderDiff(selectedLog.before, selectedLog.after)}
                  </div>
                </div>
              )}

              {selectedLog.action === "DELETE" && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Deleted Record</h4>
                  <div className="rounded-xl border bg-destructive/5 p-4">
                    {renderDiff(selectedLog.before, null)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageContainer>
  );
}
