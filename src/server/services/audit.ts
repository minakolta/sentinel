import { prisma } from "@/lib/db";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLogParams {
  userId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
  entity: string;
  entityId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: Date;
}

export interface AuditLogFilters {
  userId?: string;
  entity?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// Type for Prisma AuditLog with user relation
interface AuditLogWithUser {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  before: string | null;
  after: string | null;
  timestamp: Date;
  user: {
    name: string | null;
    email: string;
  };
}

/**
 * Audit logging service for tracking all data changes
 */
export const AuditService = {
  /**
   * Log a change to an entity
   */
  async logChange(params: AuditLogParams): Promise<void> {
    const { userId, entity, entityId, action, before, after } = params;

    await prisma.auditLog.create({
      data: {
        userId,
        entity,
        entityId,
        action,
        before: before ? JSON.stringify(sanitizeForAudit(before)) : null,
        after: after ? JSON.stringify(sanitizeForAudit(after)) : null,
      },
    });
  },

  /**
   * Get audit logs with optional filters
   */
  async getLogs(
    filters: AuditLogFilters = {},
    page = 1,
    pageSize = 50
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const where: Record<string, unknown> = {};
    const effectivePageSize = filters.limit || pageSize;

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        (where.timestamp as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.timestamp as Record<string, Date>).lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * effectivePageSize,
        take: effectivePageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log: AuditLogWithUser) => ({
        id: log.id,
        userId: log.userId,
        user: log.user,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        before: log.before ? JSON.parse(log.before) : null,
        after: log.after ? JSON.parse(log.after) : null,
        timestamp: log.timestamp,
      })),
      total,
    };
  },

  /**
   * Get audit history for a specific entity
   */
  async getEntityHistory(entity: string, entityId: string): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return logs.map((log: AuditLogWithUser) => ({
      id: log.id,
      userId: log.userId,
      user: log.user,
      entity: log.entity,
      entityId: log.entityId,
      action: log.action,
      before: log.before ? JSON.parse(log.before) : null,
      after: log.after ? JSON.parse(log.after) : null,
      timestamp: log.timestamp,
    }));
  },

  /**
   * Get distinct entities that have been audited
   */
  async getAuditedEntities(): Promise<string[]> {
    const results = await prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ["entity"],
      orderBy: { entity: "asc" },
    });
    return results.map((r: { entity: string }) => r.entity);
  },

  /**
   * Get users who have audit logs
   */
  async getAuditUsers(): Promise<{ id: string; name: string | null; email: string }[]> {
    const logs = await prisma.auditLog.findMany({
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      distinct: ["userId"],
    });
    return logs.map((l: { user: { id: string; name: string | null; email: string } }) => l.user);
  },
};

/**
 * Remove sensitive fields before storing in audit log
 */
function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    "encryptedValue",
    "encryptedSecret",
    "password",
    "secret",
    "token",
    "apiKey",
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  // Remove Prisma relation objects (keep only IDs)
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

/**
 * Compute the changes between two objects for display
 */
export function computeChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): { field: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

  if (!before && after) {
    // CREATE - show all new fields
    for (const [field, value] of Object.entries(after)) {
      changes.push({ field, oldValue: null, newValue: value });
    }
  } else if (before && !after) {
    // DELETE - show all removed fields
    for (const [field, value] of Object.entries(before)) {
      changes.push({ field, oldValue: value, newValue: null });
    }
  } else if (before && after) {
    // UPDATE - show changed fields
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const field of allKeys) {
      const oldVal = before[field];
      const newVal = after[field];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field, oldValue: oldVal, newValue: newVal });
      }
    }
  }

  return changes;
}
