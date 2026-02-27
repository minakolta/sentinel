import { prisma } from "@/lib/db";
import { encrypt, decrypt, isEncrypted } from "./encryption";

// Setting keys that should be encrypted
const SENSITIVE_KEYS = [
  "smtp.config",
  "slack.webhookUrl",
] as const;

// Default setting values
const DEFAULTS: Record<string, unknown> = {
  "org.name": "Sentinel",
  "org.allowedDomains": [],
  "org.logo": null,
  "alerts.windows": [60, 30, 14, 7, 3, 1],
  "smtp.enabled": false,
  "smtp.config": null,
  "slack.enabled": false,
  "slack.webhookUrl": null,
};

type SettingKey = keyof typeof DEFAULTS | string;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.includes(key as (typeof SENSITIVE_KEYS)[number]);
}

function encryptValue(key: string, value: unknown): unknown {
  if (!isSensitiveKey(key) || value === null || value === undefined) {
    return value;
  }
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  return encrypt(stringValue);
}

function decryptValue(key: string, value: unknown): unknown {
  if (!isSensitiveKey(key) || value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string" && isEncrypted(value)) {
    const decrypted = decrypt(value);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }
  return value;
}

export const SettingsService = {
  /**
   * Get a setting by key, with optional default
   */
  async get<T = unknown>(key: SettingKey): Promise<T | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      const defaultValue = DEFAULTS[key];
      return (defaultValue as T) ?? null;
    }

    // Parse JSON string to actual value
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(setting.value);
    } catch {
      parsedValue = setting.value;
    }

    const decrypted = decryptValue(key, parsedValue);
    return decrypted as T;
  },

  /**
   * Get multiple settings at once
   */
  async getMany<T extends Record<string, unknown>>(keys: string[]): Promise<T> {
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, unknown> = {};
    
    for (const key of keys) {
      const setting = settings.find((s: { key: string; value: string }) => s.key === key);
      if (setting) {
        let parsedValue: unknown;
        try {
          parsedValue = JSON.parse(setting.value);
        } catch {
          parsedValue = setting.value;
        }
        result[key] = decryptValue(key, parsedValue);
      } else {
        result[key] = DEFAULTS[key] ?? null;
      }
    }

    return result as T;
  },

  /**
   * Get all settings (for admin display)
   */
  async getAll(): Promise<Record<string, unknown>> {
    const settings = await prisma.setting.findMany();
    
    const result: Record<string, unknown> = { ...DEFAULTS };
    
    for (const setting of settings) {
      // For sensitive keys, don't return actual value, just indicate if set
      if (isSensitiveKey(setting.key)) {
        result[setting.key] = setting.value ? "[ENCRYPTED]" : null;
      } else {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch {
          result[setting.key] = setting.value;
        }
      }
    }

    return result;
  },

  /**
   * Set a setting value
   */
  async set(key: SettingKey, value: unknown, userId?: string): Promise<void> {
    const encryptedValue = encryptValue(key, value);
    const stringValue = typeof encryptedValue === "string" ? encryptedValue : JSON.stringify(encryptedValue);

    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: stringValue,
        updatedBy: userId,
      },
      update: {
        value: stringValue,
        updatedBy: userId,
      },
    });
  },

  /**
   * Set multiple settings at once
   */
  async setMany(
    settings: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    const operations = Object.entries(settings).map(([key, value]) => {
      const encryptedValue = encryptValue(key, value);
      const stringValue = typeof encryptedValue === "string" ? encryptedValue : JSON.stringify(encryptedValue);
      return prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          updatedBy: userId,
        },
        update: {
          value: stringValue,
          updatedBy: userId,
        },
      });
    });

    await prisma.$transaction(operations);
  },

  /**
   * Delete a setting (resets to default)
   */
  async delete(key: SettingKey): Promise<void> {
    await prisma.setting.delete({
      where: { key },
    }).catch(() => {
      // Ignore if not found
    });
  },

  /**
   * Check if a setting exists
   */
  async exists(key: SettingKey): Promise<boolean> {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { id: true },
    });
    return !!setting;
  },

  /**
   * Get organization settings for display
   */
  async getOrgSettings() {
    return this.getMany<{
      "org.name": string;
      "org.allowedDomains": string[];
    }>(["org.name", "org.allowedDomains"]);
  },

  /**
   * Get alert configuration
   */
  async getAlertSettings() {
    return this.getMany<{
      "alerts.windows": number[];
    }>(["alerts.windows"]);
  },

  /**
   * Get SMTP configuration (decrypted)
   */
  async getSmtpConfig(): Promise<{
    enabled: boolean;
    config: {
      host: string;
      port: number;
      user: string;
      pass: string;
    } | null;
  }> {
    const enabled = await this.get<boolean>("smtp.enabled");
    const config = await this.get<{
      host: string;
      port: number;
      user: string;
      pass: string;
    }>("smtp.config");

    return {
      enabled: enabled ?? false,
      config: config ?? null,
    };
  },

  /**
   * Get Slack configuration (decrypted)
   */
  async getSlackConfig(): Promise<{
    enabled: boolean;
    webhookUrl: string | null;
  }> {
    const enabled = await this.get<boolean>("slack.enabled");
    const webhookUrl = await this.get<string>("slack.webhookUrl");

    return {
      enabled: enabled ?? false,
      webhookUrl: webhookUrl ?? null,
    };
  },
};

export type { SettingKey };
