import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth, requireRole, Role } from "@/lib/auth";
import { LookupsService } from "@/server/services/lookups";
import { isValidLookupType, getSchemaForType } from "@/lib/validations/lookups";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ type: string; id: string }>;
}

// GET /api/lookups/[type]/[id] - Get single item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { type, id } = await params;
    
    if (!isValidLookupType(type)) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 });
    }

    const item = await LookupsService.getById(type, id);
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to get lookup:", error);
    return NextResponse.json({ error: "Failed to get lookup" }, { status: 500 });
  }
}

// PATCH /api/lookups/[type]/[id] - Update item (ADMIN only)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, [Role.ADMIN]);

    const { type, id } = await params;
    
    if (!isValidLookupType(type)) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 });
    }

    const existing = await LookupsService.getById(type, id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const schema = getSchemaForType(type).partial();
    const data = schema.parse(body);

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const exists = await LookupsService.nameExists(type, data.name, id);
      if (exists) {
        return NextResponse.json(
          { error: "An item with this name already exists" },
          { status: 409 }
        );
      }
    }

    const item = await LookupsService.update(type, id, data);
    return NextResponse.json(item);
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
    console.error("Failed to update lookup:", error);
    return NextResponse.json({ error: "Failed to update lookup" }, { status: 500 });
  }
}

// DELETE /api/lookups/[type]/[id] - Delete item (ADMIN only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, [Role.ADMIN]);

    const { type, id } = await params;
    
    if (!isValidLookupType(type)) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 });
    }

    const existing = await LookupsService.getById(type, id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if in use
    const inUse = await LookupsService.isInUse(type, id);
    if (inUse) {
      return NextResponse.json(
        { error: "Cannot delete: this item is currently in use" },
        { status: 409 }
      );
    }

    await LookupsService.delete(type, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Failed to delete lookup:", error);
    return NextResponse.json({ error: "Failed to delete lookup" }, { status: 500 });
  }
}
