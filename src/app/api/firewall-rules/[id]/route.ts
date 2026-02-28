import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { FirewallRuleService } from "@/server/services/firewall-rule";
import { firewallRuleSchema } from "@/lib/validations/entities";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { id } = await params;
    const rule = await FirewallRuleService.findById(id);

    if (!rule) {
      return NextResponse.json({ error: "Firewall rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch firewall rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch firewall rule" },
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
    const validated = firewallRuleSchema.partial().parse(body);
    const rule = await FirewallRuleService.update(id, validated, session!.user.id);

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Firewall rule not found") {
      return NextResponse.json({ error: "Firewall rule not found" }, { status: 404 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to update firewall rule:", error);
    return NextResponse.json(
      { error: "Failed to update firewall rule" },
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
    await FirewallRuleService.delete(id, session!.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Firewall rule not found") {
      return NextResponse.json({ error: "Firewall rule not found" }, { status: 404 });
    }
    console.error("Failed to delete firewall rule:", error);
    return NextResponse.json(
      { error: "Failed to delete firewall rule" },
      { status: 500 }
    );
  }
}
