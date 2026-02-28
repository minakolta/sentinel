import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { ComponentService } from "@/server/services/component";

interface RouteParams {
  params: Promise<{ id: string; componentId: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { componentId } = await params;

    await ComponentService.delete(componentId, session!.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Component not found") {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    console.error("Failed to delete component:", error);
    return NextResponse.json(
      { error: "Failed to delete component" },
      { status: 500 }
    );
  }
}
