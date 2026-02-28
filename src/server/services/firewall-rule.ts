import { prisma } from "@/lib/db";
import { AuditService } from "./audit";
import type { FirewallRuleInput } from "@/lib/validations/entities";

export interface FirewallRule {
  id: string;
  customerId: string;
  srcRole: string | null;
  srcIp: string;
  dstRole: string | null;
  dstIp: string;
  port: number;
  protocol: string;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
}

export const FirewallRuleService = {
  /**
   * Get all firewall rules with relations
   */
  async findAll(customerId?: string): Promise<FirewallRule[]> {
    return prisma.firewallRule.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: [{ customer: { name: "asc" } }, { srcIp: "asc" }, { dstIp: "asc" }],
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  },

  /**
   * Get a firewall rule by ID
   */
  async findById(id: string): Promise<FirewallRule | null> {
    return prisma.firewallRule.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  },

  /**
   * Create a new firewall rule
   */
  async create(data: FirewallRuleInput, userId: string): Promise<FirewallRule> {
    const rule = await prisma.firewallRule.create({
      data: {
        customerId: data.customerId,
        srcRole: data.srcRole || null,
        srcIp: data.srcIp,
        dstRole: data.dstRole || null,
        dstIp: data.dstIp,
        port: data.port,
        protocol: data.protocol,
        comment: data.comment || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "FirewallRule",
      entityId: rule.id,
      action: "CREATE",
      after: rule as unknown as Record<string, unknown>,
    });

    return rule;
  },

  /**
   * Update a firewall rule
   */
  async update(id: string, data: Partial<FirewallRuleInput>, userId: string): Promise<FirewallRule> {
    const before = await prisma.firewallRule.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Firewall rule not found");
    }

    const rule = await prisma.firewallRule.update({
      where: { id },
      data: {
        customerId: data.customerId,
        srcRole: data.srcRole,
        srcIp: data.srcIp,
        dstRole: data.dstRole,
        dstIp: data.dstIp,
        port: data.port,
        protocol: data.protocol,
        comment: data.comment,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "FirewallRule",
      entityId: rule.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: rule as unknown as Record<string, unknown>,
    });

    return rule;
  },

  /**
   * Delete a firewall rule
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.firewallRule.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Firewall rule not found");
    }

    await prisma.firewallRule.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "FirewallRule",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },
};
