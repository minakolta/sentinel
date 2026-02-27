import { z } from "zod";

// Organization settings
export const orgSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  allowedDomains: z.array(z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/, "Invalid domain format")),
  logo: z.string().optional(),
});

export type OrgSettings = z.infer<typeof orgSettingsSchema>;

// Alert settings
export const alertSettingsSchema = z.object({
  windows: z.array(z.number().int().positive().max(365)).min(1, "At least one alert window is required"),
});

export type AlertSettings = z.infer<typeof alertSettingsSchema>;

// SMTP settings
export const smtpSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
});

export type SmtpSettings = z.infer<typeof smtpSettingsSchema>;

// Slack settings
export const slackSettingsSchema = z.object({
  enabled: z.boolean(),
  webhookUrl: z.string().url("Invalid webhook URL").optional().or(z.literal("")),
});

export type SlackSettings = z.infer<typeof slackSettingsSchema>;

// Generic setting update
export const settingUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

export type SettingUpdate = z.infer<typeof settingUpdateSchema>;
