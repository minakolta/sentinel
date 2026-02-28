import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth, requireRole } from "@/lib/auth";
import { AuditService } from "@/server/services/audit";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, ["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const action = searchParams.get("action") as "CREATE" | "UPDATE" | "DELETE" | undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    const logs = await AuditService.getLogs({
      userId,
      entity,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
