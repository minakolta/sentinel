import { prisma } from "@/lib/db";
import type { LookupType } from "@/lib/validations/lookups";

type LookupItem = {
  id: string;
  name: string;
  createdAt: Date;
  order?: number;
  isJwt?: boolean;
};

function getModelForType(type: LookupType) {
  switch (type) {
    case "products":
      return prisma.product;
    case "environments":
      return prisma.environment;
    case "operating-systems":
      return prisma.operatingSystem;
    case "component-types":
      return prisma.componentType;
    case "license-types":
      return prisma.licenseType;
  }
}

export const LookupsService = {
  /**
   * Get all items for a lookup type
   */
  async getAll(type: LookupType): Promise<LookupItem[]> {
    const model = getModelForType(type);
    
    if (type === "environments") {
      return prisma.environment.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (model as any).findMany({
      orderBy: { name: "asc" },
    });
  },

  /**
   * Get a single item by ID
   */
  async getById(type: LookupType, id: string): Promise<LookupItem | null> {
    const model = getModelForType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (model as any).findUnique({
      where: { id },
    });
  },

  /**
   * Create a new lookup item
   */
  async create(type: LookupType, data: { name: string; order?: number; isJwt?: boolean }): Promise<LookupItem> {
    const model = getModelForType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (model as any).create({
      data,
    });
  },

  /**
   * Update a lookup item
   */
  async update(type: LookupType, id: string, data: { name?: string; order?: number; isJwt?: boolean }): Promise<LookupItem> {
    const model = getModelForType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (model as any).update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a lookup item
   */
  async delete(type: LookupType, id: string): Promise<void> {
    const model = getModelForType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (model as any).delete({
      where: { id },
    });
  },

  /**
   * Check if a name already exists
   */
  async nameExists(type: LookupType, name: string, excludeId?: string): Promise<boolean> {
    const model = getModelForType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (model as any).findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  },

  /**
   * Check if a lookup item is in use
   */
  async isInUse(type: LookupType, id: string): Promise<boolean> {
    switch (type) {
      case "products": {
        const count = await prisma.license.count({ where: { productId: id } });
        return count > 0;
      }
      case "environments": {
        const serverCount = await prisma.server.count({ where: { environmentId: id } });
        const licenseCount = await prisma.license.count({ where: { environmentId: id } });
        return serverCount > 0 || licenseCount > 0;
      }
      case "operating-systems": {
        const count = await prisma.server.count({ where: { osId: id } });
        return count > 0;
      }
      case "component-types": {
        const count = await prisma.component.count({ where: { typeId: id } });
        return count > 0;
      }
      case "license-types": {
        const count = await prisma.license.count({ where: { typeId: id } });
        return count > 0;
      }
      default:
        return false;
    }
  },
};
