import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { LicenseService } from "@/server/services/license";
import { licenseSchema } from "@/lib/validations/entities";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;
    const expiring = searchParams.get("expiring");

    let licenses;
    if (expiring) {
      licenses = await LicenseService.findExpiring(parseInt(expiring, 10));
    } else {
      licenses = await LicenseService.findAll(customerId);
    }

    return NextResponse.json(licenses);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await req.json();
    const validated = licenseSchema.parse(body);
    const license = await LicenseService.create(validated, session!.user.id);

    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to create license:", error);
    return NextResponse.json(
      { error: "Failed to create license" },
      { status: 500 }
    );
  }
}
