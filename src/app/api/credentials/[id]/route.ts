import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { CredentialService } from "@/server/services/credential";
import { credentialSchema } from "@/lib/validations/entities";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const credential = await CredentialService.findById(id);

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    return NextResponse.json(credential);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch credential:", error);
    return NextResponse.json(
      { error: "Failed to fetch credential" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const body = await req.json();
    const validated = credentialSchema.partial().parse(body);
    const credential = await CredentialService.update(id, validated, session!.user.id);

    return NextResponse.json(credential);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Credential not found") {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to update credential:", error);
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    await CredentialService.delete(id, session!.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Credential not found") {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    console.error("Failed to delete credential:", error);
    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}
