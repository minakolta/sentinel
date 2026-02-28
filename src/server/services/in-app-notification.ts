import { prisma } from "@/lib/db";

export type NotificationType = "info" | "warning" | "error" | "success";

export interface CreateInAppNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
  linkText?: string;
}

export interface InAppNotificationWithUser {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  linkText: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationFilters {
  userId: string;
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

/**
 * In-app notification service for managing user notifications within the application
 */
export const InAppNotificationService = {
  /**
   * Create a new notification for a user
   */
  async create(data: CreateInAppNotificationInput): Promise<InAppNotificationWithUser> {
    return prisma.inAppNotification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "info",
        linkUrl: data.linkUrl,
        linkText: data.linkText,
      },
    });
  },

  /**
   * Create notifications for multiple users
   */
  async createForUsers(
    userIds: string[],
    notification: Omit<CreateInAppNotificationInput, "userId">
  ): Promise<number> {
    const result = await prisma.inAppNotification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        linkUrl: notification.linkUrl,
        linkText: notification.linkText,
      })),
    });
    return result.count;
  },

  /**
   * Create a notification for all users (e.g., system announcements)
   */
  async createForAllUsers(
    notification: Omit<CreateInAppNotificationInput, "userId">
  ): Promise<number> {
    const users = await prisma.user.findMany({ select: { id: true } });
    return this.createForUsers(
      users.map((u) => u.id),
      notification
    );
  },

  /**
   * Get notifications for a user
   */
  async findByUser(filters: NotificationFilters): Promise<InAppNotificationWithUser[]> {
    return prisma.inAppNotification.findMany({
      where: {
        userId: filters.userId,
        ...(filters.read !== undefined && { read: filters.read }),
        ...(filters.type && { type: filters.type }),
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  },

  /**
   * Get a single notification
   */
  async findById(id: string): Promise<InAppNotificationWithUser | null> {
    return prisma.inAppNotification.findUnique({
      where: { id },
    });
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.inAppNotification.count({
      where: { userId, read: false },
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<InAppNotificationWithUser | null> {
    // Verify ownership
    const notification = await prisma.inAppNotification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    return prisma.inAppNotification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    return result.count;
  },

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const notification = await prisma.inAppNotification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return false;
    }

    await prisma.inAppNotification.delete({ where: { id } });
    return true;
  },

  /**
   * Delete all read notifications older than X days
   */
  async deleteOldReadNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.inAppNotification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: cutoffDate },
      },
    });
    return result.count;
  },

  /**
   * Create a license expiry notification
   */
  async notifyLicenseExpiry(
    userId: string,
    licenseId: string,
    productName: string,
    customerName: string,
    daysUntilExpiry: number
  ): Promise<InAppNotificationWithUser> {
    const urgency = daysUntilExpiry <= 7 ? "error" : daysUntilExpiry <= 30 ? "warning" : "info";
    const urgencyText = daysUntilExpiry <= 7 ? "URGENT" : "Warning";

    return this.create({
      userId,
      title: `${urgencyText}: License Expiring`,
      message: `${productName} license for ${customerName} expires in ${daysUntilExpiry} days`,
      type: urgency as NotificationType,
      linkUrl: `/licenses/${licenseId}`,
      linkText: "View License",
    });
  },
};
