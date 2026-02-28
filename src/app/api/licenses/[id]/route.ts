import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { LicenseService } from "@/server/services/license";
import { licenseSchema } from "@/lib/validations/entities";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const license = await LicenseService.findById(id);

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch license:", error);
    return NextResponse.json(
      { error: "Failed to fetch license" },
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
    const validated = licenseSchema.partial().parse(body);
    const license = await LicenseService.update(id, validated, session!.user.id);

    return NextResponse.json(license);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "License not found") {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to update license:", error);
    return NextResponse.json(
      { error: "Failed to update license" },
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
    await LicenseService.delete(id, session!.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "License not found") {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    console.error("Failed to delete license:", error);
    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 }
    );
  }
}
