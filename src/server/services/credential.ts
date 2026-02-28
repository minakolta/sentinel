import { prisma } from "@/lib/db";
import { AuditService } from "./audit";
import { encrypt, decrypt } from "./encryption";
import type { CredentialInput } from "@/lib/validations/entities";

export interface Credential {
  id: string;
  customerId: string;
  serverId: string | null;
  username: string;
  encryptedSecret: string;
  url: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  server?: {
    id: string;
    hostname: string;
  } | null;
}

export const CredentialService = {
  /**
   * Get all credentials with relations
   */
  async findAll(customerId?: string): Promise<Credential[]> {
    return prisma.credential.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: [{ customer: { name: "asc" } }, { username: "asc" }],
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
      },
    });
  },

  /**
   * Get a credential by ID
   */
  async findById(id: string): Promise<Credential | null> {
    return prisma.credential.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
      },
    });
  },

  /**
   * Get decrypted credential secret
   */
  async getDecryptedSecret(id: string): Promise<string> {
    const credential = await prisma.credential.findUnique({
      where: { id },
      select: { encryptedSecret: true },
    });

    if (!credential) {
      throw new Error("Credential not found");
    }

    return decrypt(credential.encryptedSecret);
  },

  /**
   * Create a new credential
   */
  async create(data: CredentialInput, userId: string): Promise<Credential> {
    const encryptedSecret = encrypt(data.secret);

    const credential = await prisma.credential.create({
      data: {
        customerId: data.customerId,
        serverId: data.serverId || null,
        username: data.username,
        encryptedSecret,
        url: data.url || null,
        notes: data.notes || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Credential",
      entityId: credential.id,
      action: "CREATE",
      after: credential as unknown as Record<string, unknown>,
    });

    return credential;
  },

  /**
   * Update a credential
   */
  async update(id: string, data: Partial<CredentialInput>, userId: string): Promise<Credential> {
    const before = await prisma.credential.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Credential not found");
    }

    const updateData: Record<string, unknown> = {};

    if (data.customerId) updateData.customerId = data.customerId;
    if (data.serverId !== undefined) updateData.serverId = data.serverId || null;
    if (data.username) updateData.username = data.username;
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.secret) updateData.encryptedSecret = encrypt(data.secret);

    const credential = await prisma.credential.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
      },
    });

    await AuditService.logChange({
      userId,
      entity: "Credential",
      entityId: credential.id,
      action: "UPDATE",
      before: before as unknown as Record<string, unknown>,
      after: credential as unknown as Record<string, unknown>,
    });

    return credential;
  },

  /**
   * Delete a credential
   */
  async delete(id: string, userId: string): Promise<void> {
    const before = await prisma.credential.findUnique({ where: { id } });
    if (!before) {
      throw new Error("Credential not found");
    }

    await prisma.credential.delete({ where: { id } });

    await AuditService.logChange({
      userId,
      entity: "Credential",
      entityId: id,
      action: "DELETE",
      before: before as unknown as Record<string, unknown>,
    });
  },
};
