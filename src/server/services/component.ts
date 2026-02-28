import { prisma } from "@/lib/db";
import { AuditService } from "./audit";

export interface ComponentInput {
  serverId: string;
  typeId: string;
}

export interface ComponentWithType {
  id: string;
  serverId: string;
  typeId: string;
  type: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Component management service
 */
export const ComponentService = {
  /**
   * Find all components for a server
   */
  async findByServer(serverId: string): Promise<ComponentWithType[]> {
    return prisma.component.findMany({
      where: { serverId },
      include: {
        type: true,
      },
      orderBy: { type: { name: "asc" } },
    });
  },

  /**
   * Find a single component by ID
   */
  async findById(id: string): Promise<ComponentWithType | null> {
    return prisma.component.findUnique({
      where: { id },
      include: {
        type: true,
      },
    });
  },

  /**
   * Create a new component
   */
  async create(data: ComponentInput, userId: string): Promise<ComponentWithType> {
    // Check if server exists
    const server = await prisma.server.findUnique({
      where: { id: data.serverId },
    });
    if (!server) {
      throw new Error("Server not found");
    }

    // Check if component type exists
    const componentType = await prisma.componentType.findUnique({
      where: { id: data.typeId },
    });
    if (!componentType) {
      throw new Error("Component type not found");
    }

    // Check for duplicate (server already has this component type)
    const existing = await prisma.component.findUnique({
      where: {
        serverId_typeId: {
          serverId: data.serverId,
          typeId: data.typeId,
        },
      },
    });
    if (existing) {
      throw new Error("Server already has this component type");
    }

    const component = await prisma.component.create({
      data: {
        serverId: data.serverId,
        typeId: data.typeId,
      },
      include: {
        type: true,
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Component",
      entityId: component.id,
      action: "CREATE",
      before: null,
      after: {
        serverId: component.serverId,
        typeId: component.typeId,
        typeName: component.type.name,
      },
    });

    return component;
  },

  /**
   * Update a component's type
   */
  async update(
    id: string,
    data: { typeId: string },
    userId: string
  ): Promise<ComponentWithType> {
    const existing = await prisma.component.findUnique({
      where: { id },
      include: { type: true },
    });

    if (!existing) {
      throw new Error("Component not found");
    }

    // Check if new type exists
    const componentType = await prisma.componentType.findUnique({
      where: { id: data.typeId },
    });
    if (!componentType) {
      throw new Error("Component type not found");
    }

    // Check for duplicate (another component with this type on same server)
    if (data.typeId !== existing.typeId) {
      const duplicate = await prisma.component.findUnique({
        where: {
          serverId_typeId: {
            serverId: existing.serverId,
            typeId: data.typeId,
          },
        },
      });
      if (duplicate) {
        throw new Error("Server already has this component type");
      }
    }

    const component = await prisma.component.update({
      where: { id },
      data: { typeId: data.typeId },
      include: { type: true },
    });

    await AuditService.logChange({
      userId,
      entity: "Component",
      entityId: component.id,
      action: "UPDATE",
      before: {
        typeId: existing.typeId,
        typeName: existing.type.name,
      },
      after: {
        typeId: component.typeId,
        typeName: component.type.name,
      },
    });

    return component;
  },

  /**
   * Delete a component
   */
  async delete(id: string, userId: string): Promise<void> {
    const component = await prisma.component.findUnique({
      where: { id },
      include: { type: true },
    });

    if (!component) {
      throw new Error("Component not found");
    }

    await prisma.component.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "Component",
      entityId: id,
      action: "DELETE",
      before: {
        serverId: component.serverId,
        typeId: component.typeId,
        typeName: component.type.name,
      },
      after: null,
    });
  },
};
