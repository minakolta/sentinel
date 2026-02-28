import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { InAppNotificationService } from "@/server/services/in-app-notification";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { searchParams } = new URL(req.url);
    const read = searchParams.get("read");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const notifications = await InAppNotificationService.findByUser({
      userId: session!.user.id,
      ...(read !== null && { read: read === "true" }),
      ...(type && { type: type as "info" | "warning" | "error" | "success" }),
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(offset && { offset: parseInt(offset, 10) }),
    });

    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
