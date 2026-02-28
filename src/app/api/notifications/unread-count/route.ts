import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { InAppNotificationService } from "@/server/services/in-app-notification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const count = await InAppNotificationService.getUnreadCount(session!.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get unread count:", error);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
