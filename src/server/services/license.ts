import { prisma } from "@/lib/db";
import { AuditService } from "./audit";
import { encrypt, decrypt } from "./encryption";
import type { LicenseInput } from "@/lib/validations/entities";

export interface License {
  id: string;
  customerId: string;
  productId: string;
  typeId: string;
  environmentId: string;
  encryptedValue: string;
  expiresAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    name: string;
  };
  type?: {
    id: string;
    name: string;
    isJwt: boolean;
  };
  environment?: {
    id: string;
    name: string;
  };
}

export const LicenseService = {
  /**
   * Get all licenses with relations
   */
  async findAll(customerId?: string): Promise<License[]> {
    return prisma.license.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: [{ expiresAt: "asc" }],
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, isJwt: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Get licenses expiring within N days
   */
  async findExpiring(days: number): Promise<License[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.license.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      orderBy: { expiresAt: "asc" },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, isJwt: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Get a license by ID
   */
  async findById(id: string): Promise<License | null> {
    return prisma.license.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, isJwt: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Get decrypted license value
   */
  async getDecryptedValue(id: string): Promise<string> {
    const license = await prisma.license.findUnique({
      where: { id },
      select: { encryptedValue: true },
    });

    if (!license) {
      throw new Error("License not found");
    }

    return decrypt(license.encryptedValue);
  },

  /**
   * Create a new license
   */
  async create(data: LicenseInput, userId: string): Promise<License> {
    const encryptedValue = encrypt(data.value);

    const license = await prisma.license.create({
      data: {
        customerId: data.customerId,
        productId: data.productId,
        typeId: data.typeId,
        environmentId: data.environmentId,
        encryptedValue,
        expiresAt: new Date(data.expiresAt),
        notes: data.notes || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, isJwt: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "License",
      entityId: license.id,
      action: "CREATE",
      after: license as unknown as Record<string, unknown>,
    });

    return license;
  },

  /**
   * Update a license
   */
  async update(id: string, data: Partial<LicenseInput>, userId: string): Promise<License> {
    const before = await prisma.license.findUnique({ where: { id } });
    if (!before) {
      throw new Error("License not found");
    }

    const updateData: Record<string, unknown> = {};

    if (data.customerId) updateData.customerId = data.customerId;
    if (data.productId) updateData.productId = data.productId;
    if (data.typeId) updateData.typeId = data.typeId;
    if (data.environmentId) updateData.environmentId = data.environmentId;
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.value) updateData.encryptedValue = encrypt(data.value);

    const license = await prisma.license.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true },
        },
        type: {
          select: { id: true, name: true, isJwt: true },
        },
        environment: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "License",
      entityId: license.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: license as unknown as Record<string, unknown>,
    });

    return license;
  },

  /**
   * Delete a license
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.license.findUnique({ where: { id } });
    if (!before) {
      throw new Error("License not found");
    }

    await prisma.license.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "License",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },

  /**
   * Get license statistics
   */
  async getStats(): Promise<{
    total: number;
    expiringSoon: number;
    expired: number;
  }> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [total, expiringSoon, expired] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({
        where: {
          expiresAt: {
            gt: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      prisma.license.count({
        where: {
          expiresAt: { lt: now },
        },
      }),
    ]);

    return { total, expiringSoon, expired };
  },
};
