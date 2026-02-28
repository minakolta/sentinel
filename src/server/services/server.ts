import { prisma } from "@/lib/db";
import { AuditService } from "./audit";
import type { ServerInput } from "@/lib/validations/entities";

export interface Server {
  id: string;
  hostname: string;
  ip: string;
  role: string | null;
  customerId: string;
  osId: string;
  environmentId: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  os?: {
    id: string;
    name: string;
  };
  environment?: {
    id: string;
    name: string;
  };
  _count?: {
    components: number;
    credentials: number;
  };
}

export const ServerService = {
  /**
   * Get all servers with relations
   */
  async findAll(customerId?: string): Promise<Server[]> {
    return prisma.server.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: [{ customer: { name: "asc" } }, { hostname: "asc" }],
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        os: {
          select: { id: true, name: true },
        },
        environment: {
          select: { id: true, name: true },
        },
        _count: {
          select: { components: true, credentials: true },
        },
      },
    });
  },

  /**
   * Get a server by ID
   */
  async findById(id: string): Promise<Server | null> {
    return prisma.server.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        os: {
          select: { id: true, name: true },
        },
        environment: {
          select: { id: true, name: true },
        },
        _count: {
          select: { components: true, credentials: true },
        },
      },
    });
  },

  /**
   * Create a new server
   */
  async create(data: ServerInput, userId: string): Promise<Server> {
    const server = await prisma.server.create({
      data: {
        hostname: data.hostname,
        ip: data.ip,
        role: data.role || null,
        customerId: data.customerId,
        osId: data.osId,
        environmentId: data.environmentId,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        os: {
          select: { id: true, name: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Server",
      entityId: server.id,
      action: "CREATE",
      after: server as unknown as Record<string, unknown>,
    });

    return server;
  },

  /**
   * Update a server
   */
  async update(id: string, data: Partial<ServerInput>, userId: string): Promise<Server> {
    const before = await prisma.server.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Server not found");
    }

    const server = await prisma.server.update({
      where: { id },
      data: {
        hostname: data.hostname,
        ip: data.ip,
        role: data.role,
        customerId: data.customerId,
        osId: data.osId,
        environmentId: data.environmentId,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        os: {
          select: { id: true, name: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Server",
      entityId: server.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: server as unknown as Record<string, unknown>,
    });

    return server;
  },

  /**
   * Delete a server
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.server.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Server not found");
    }

    await prisma.server.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "Server",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },
};
