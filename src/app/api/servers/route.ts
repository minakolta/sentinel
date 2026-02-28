import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { ServerService } from "@/server/services/server";
import { serverSchema } from "@/lib/validations/entities";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;

    const servers = await ServerService.findAll(customerId);
    return NextResponse.json(servers);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch servers:", error);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await req.json();
    const validated = serverSchema.parse(body);
    const server = await ServerService.create(validated, session!.user.id);

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to create server:", error);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}
