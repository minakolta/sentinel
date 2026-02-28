import { prisma } from "@/lib/db";
import { SettingsService } from "./settings";

export type NotificationChannel = "email" | "slack";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  html?: string;
}

export interface SlackNotification {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: Array<{
    type: string;
    text?: string;
  }>;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
}

export interface LicenseExpiryNotification {
  licenseId: string;
  customerName: string;
  productName: string;
  environmentName: string;
  expiresAt: Date;
  daysBeforeExpiry: number;
}

/**
 * Notification service for sending alerts via email and Slack
 */
export const NotificationService = {
  /**
   * Send an email notification
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    try {
      const enabled = await SettingsService.get<boolean>("smtp.enabled");
      if (!enabled) {
        return {
          success: false,
          channel: "email",
          error: "Email notifications are disabled",
        };
      }

      const config = await SettingsService.get<SmtpConfig>("smtp.config");
      if (!config) {
        return {
          success: false,
          channel: "email",
          error: "SMTP configuration not found",
        };
      }

      // Dynamic import of nodemailer to avoid bundling issues
      const nodemailer = await import("nodemailer");
      
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });

      await transporter.sendMail({
        from: config.from,
        to: notification.to.join(", "),
        subject: notification.subject,
        text: notification.body,
        html: notification.html,
      });

      return {
        success: true,
        channel: "email",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      console.error("[NotificationService] Email error:", message);
      return {
        success: false,
        channel: "email",
        error: message,
      };
    }
  },

  /**
   * Send a Slack notification via webhook
   */
  async sendSlack(notification: SlackNotification): Promise<NotificationResult> {
    try {
      const enabled = await SettingsService.get<boolean>("slack.enabled");
      if (!enabled) {
        return {
          success: false,
          channel: "slack",
          error: "Slack notifications are disabled",
        };
      }

      const webhookUrl = await SettingsService.get<string>("slack.webhookUrl");
      if (!webhookUrl) {
        return {
          success: false,
          channel: "slack",
          error: "Slack webhook URL not configured",
        };
      }

      const payload = notification.blocks
        ? { blocks: notification.blocks, text: notification.text }
        : { text: notification.text };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Slack webhook returned ${response.status}: ${text}`);
      }

      return {
        success: true,
        channel: "slack",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Slack error";
      console.error("[NotificationService] Slack error:", message);
      return {
        success: false,
        channel: "slack",
        error: message,
      };
    }
  },

  /**
   * Check if a notification has already been sent for a license/channel/days combination
   */
  async hasBeenSent(
    licenseId: string,
    channel: NotificationChannel,
    daysBeforeExpiry: number
  ): Promise<boolean> {
    const existing = await prisma.notificationLog.findUnique({
      where: {
        licenseId_channel_daysBeforeExpiry: {
          licenseId,
          channel,
          daysBeforeExpiry,
        },
      },
    });
    return existing !== null;
  },

  /**
   * Log a sent notification (for deduplication)
   */
  async logNotification(
    licenseId: string,
    channel: NotificationChannel,
    daysBeforeExpiry: number
  ): Promise<void> {
    await prisma.notificationLog.upsert({
      where: {
        licenseId_channel_daysBeforeExpiry: {
          licenseId,
          channel,
          daysBeforeExpiry,
        },
      },
      update: {
        sentAt: new Date(),
      },
      create: {
        licenseId,
        channel,
        daysBeforeExpiry,
      },
    });
  },

  /**
   * Send a license expiry notification (with deduplication)
   */
  async sendLicenseExpiryAlert(
    notification: LicenseExpiryNotification,
    channels: NotificationChannel[] = ["email", "slack"]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channel of channels) {
      // Check if already sent
      const alreadySent = await this.hasBeenSent(
        notification.licenseId,
        channel,
        notification.daysBeforeExpiry
      );

      if (alreadySent) {
        results.push({
          success: true,
          channel,
          error: "Already sent (deduplicated)",
        });
        continue;
      }

      const subject = `License Expiry Alert: ${notification.productName} - ${notification.customerName}`;
      const expiryDate = notification.expiresAt.toLocaleDateString();
      const urgency = notification.daysBeforeExpiry <= 7 ? "🚨 URGENT" : "⚠️ Warning";

      let result: NotificationResult;

      if (channel === "email") {
        result = await this.sendEmail({
          to: [], // Will be populated by caller based on customer contacts
          subject,
          body: [
            `${urgency}: License Expiring Soon`,
            "",
            `Customer: ${notification.customerName}`,
            `Product: ${notification.productName}`,
            `Environment: ${notification.environmentName}`,
            `Expires: ${expiryDate}`,
            `Days Remaining: ${notification.daysBeforeExpiry}`,
            "",
            "Please take action to renew this license before it expires.",
          ].join("\n"),
          html: `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: ${notification.daysBeforeExpiry <= 7 ? '#dc2626' : '#ca8a04'};">
                ${urgency}: License Expiring Soon
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Customer</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${notification.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Product</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${notification.productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Environment</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${notification.environmentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Expires</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${expiryDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Days Remaining</strong></td>
                  <td style="padding: 8px; color: ${notification.daysBeforeExpiry <= 7 ? '#dc2626' : '#ca8a04'}; font-weight: bold;">
                    ${notification.daysBeforeExpiry}
                  </td>
                </tr>
              </table>
              <p style="margin-top: 20px; color: #6b7280;">
                Please take action to renew this license before it expires.
              </p>
            </div>
          `,
        });
      } else {
        result = await this.sendSlack({
          text: `${urgency}: ${notification.productName} license for ${notification.customerName} expires in ${notification.daysBeforeExpiry} days`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `${urgency} License Expiry Alert`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: [
                  `*Customer:* ${notification.customerName}`,
                  `*Product:* ${notification.productName}`,
                  `*Environment:* ${notification.environmentName}`,
                  `*Expires:* ${expiryDate}`,
                  `*Days Remaining:* ${notification.daysBeforeExpiry}`,
                ].join("\n"),
              },
            },
          ],
        });
      }

      // Log notification if successful
      if (result.success) {
        await this.logNotification(
          notification.licenseId,
          channel,
          notification.daysBeforeExpiry
        );
      }

      results.push(result);
    }

    return results;
  },

  /**
   * Get notification history for a license
   */
  async getNotificationHistory(licenseId: string) {
    return prisma.notificationLog.findMany({
      where: { licenseId },
      orderBy: { sentAt: "desc" },
    });
  },

  /**
   * Get all notification logs with filters
   */
  async getNotificationLogs(filters?: {
    licenseId?: string;
    channel?: NotificationChannel;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return prisma.notificationLog.findMany({
      where: {
        ...(filters?.licenseId && { licenseId: filters.licenseId }),
        ...(filters?.channel && { channel: filters.channel }),
        ...(filters?.startDate || filters?.endDate
          ? {
              sentAt: {
                ...(filters?.startDate && { gte: filters.startDate }),
                ...(filters?.endDate && { lte: filters.endDate }),
              },
            }
          : {}),
      },
      include: {
        license: {
          include: {
            customer: true,
            product: true,
            environment: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: filters?.limit,
    });
  },

  /**
   * Test email configuration by sending a test message
   */
  async testEmail(to: string): Promise<NotificationResult> {
    return this.sendEmail({
      to: [to],
      subject: "Sentinel Test Email",
      body: "This is a test email from Sentinel. If you received this, your SMTP configuration is working correctly.",
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #0284c7;">Sentinel Test Email</h2>
          <p>This is a test email from Sentinel.</p>
          <p style="color: #16a34a;">✓ Your SMTP configuration is working correctly.</p>
        </div>
      `,
    });
  },

  /**
   * Test Slack configuration by sending a test message
   */
  async testSlack(): Promise<NotificationResult> {
    return this.sendSlack({
      text: "Sentinel Test Message - Your Slack integration is working correctly! ✓",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Sentinel Test Message*\n✓ Your Slack integration is working correctly!",
          },
        },
      ],
    });
  },
};
