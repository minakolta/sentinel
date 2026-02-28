import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { CredentialService } from "@/server/services/credential";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const secret = await CredentialService.getDecryptedSecret(id);

    return NextResponse.json({ secret });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Credential not found") {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    console.error("Failed to get credential secret:", error);
    return NextResponse.json(
      { error: "Failed to get credential secret" },
      { status: 500 }
    );
  }
}
