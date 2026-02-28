import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth } from "@/lib/auth";
import { FirewallRuleService } from "@/server/services/firewall-rule";
import { firewallRuleSchema } from "@/lib/validations/entities";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;

    const rules = await FirewallRuleService.findAll(customerId);
    return NextResponse.json(rules);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch firewall rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch firewall rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await req.json();
    const validated = firewallRuleSchema.parse(body);
    const rule = await FirewallRuleService.create(validated, session!.user.id);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Failed to create firewall rule:", error);
    return NextResponse.json(
      { error: "Failed to create firewall rule" },
      { status: 500 }
    );
  }
}
