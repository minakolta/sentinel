import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { LicenseService } from "@/server/services/license";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const value = await LicenseService.getDecryptedValue(id);

    return NextResponse.json({ value });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "License not found") {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    console.error("Failed to get license value:", error);
    return NextResponse.json(
      { error: "Failed to get license value" },
      { status: 500 }
    );
  }
}
