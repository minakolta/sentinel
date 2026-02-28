import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { CredentialService } from "@/server/services/credential";
import { credentialSchema } from "@/lib/validations/entities";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;

    const credentials = await CredentialService.findAll(customerId);
    return NextResponse.json(credentials);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await req.json();
    const validated = credentialSchema.parse(body);
    const credential = await CredentialService.create(validated, session!.user.id);

    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to create credential:", error);
    return NextResponse.json(
      { error: "Failed to create credential" },
      { status: 500 }
    );
  }
}
