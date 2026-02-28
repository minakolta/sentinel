import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth, requireRole, Role } from "@/lib/auth";
import { LookupsService } from "@/server/services/lookups";
import { isValidLookupType, getSchemaForType, type LookupType } from "@/lib/validations/lookups";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ type: string }>;
}

// GET /api/entities/[type] - List all items
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { type } = await params;
    
    if (!isValidLookupType(type)) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 });
    }

    const items = await LookupsService.getAll(type);
    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get lookups:", error);
    return NextResponse.json({ error: "Failed to get lookups" }, { status: 500 });
  }
}

// POST /api/entities/[type] - Create new item (ADMIN only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, [Role.ADMIN]);

    const { type } = await params;
    
    if (!isValidLookupType(type)) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 });
    }

    const body = await request.json();
    const schema = getSchemaForType(type);
    const data = schema.parse(body);

    // Check for duplicate name
    const exists = await LookupsService.nameExists(type, data.name);
    if (exists) {
      return NextResponse.json(
        { error: "An item with this name already exists" },
        { status: 409 }
      );
    }

    const item = await LookupsService.create(type, data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Failed to create lookup:", error);
    return NextResponse.json({ error: "Failed to create lookup" }, { status: 500 });
  }
}
