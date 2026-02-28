import { prisma } from "@/lib/db";
import { AuditService } from "./audit";
import type { CustomerInput } from "@/lib/validations/entities";

export interface Customer {
  id: string;
  name: string;
  code: string;
  contacts: string | null;
  projectManagers: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    servers: number;
    licenses: number;
    credentials: number;
    firewallRules: number;
  };
}

export const CustomerService = {
  /**
   * Get all customers with counts
   */
  async findAll(): Promise<Customer[]> {
    return prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            servers: true,
            licenses: true,
            credentials: true,
            firewallRules: true,
          },
        },
      },
    });
  },

  /**
   * Get a customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            servers: true,
            licenses: true,
            credentials: true,
            firewallRules: true,
          },
        },
      },
    });
  },

  /**
   * Get a customer by code
   */
  async findByCode(code: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { code },
    });
  },

  /**
   * Create a new customer
   */
  async create(data: CustomerInput, userId: string): Promise<Customer> {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        contacts: data.contacts || null,
        projectManagers: data.projectManagers || null,
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Customer",
      entityId: customer.id,
      action: "CREATE",
      after: customer as unknown as Record<string, unknown>,
    });

    return customer;
  },

  /**
   * Update a customer
   */
  async update(id: string, data: Partial<CustomerInput>, userId: string): Promise<Customer> {
    const before = await prisma.customer.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Customer not found");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code?.toUpperCase(),
        contacts: data.contacts,
        projectManagers: data.projectManagers,
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Customer",
      entityId: customer.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: customer as unknown as Record<string, unknown>,
    });

    return customer;
  },

  /**
   * Delete a customer
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.customer.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Customer not found");
    }

    await prisma.customer.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "Customer",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },

  /**
   * Search customers by name or code
   */
  async search(query: string): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query.toUpperCase() } },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });
  },
};
