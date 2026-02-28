import { z } from "zod";

// Contact schema for customer form
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string().optional(),
});

// Project Manager schema for customer form
const projectManagerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
});

// Customer validation (form version with arrays)
export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric with dashes/underscores"),
  contacts: z.array(contactSchema).optional(),
  projectManagers: z.array(projectManagerSchema).optional(),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;

// Customer validation (API version with JSON strings)
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric with dashes/underscores"),
  contacts: z.string().optional().nullable(),
  projectManagers: z.string().optional().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// Server validation
export const serverSchema = z.object({
  hostname: z.string().min(1, "Hostname is required").max(255),
  ip: z
    .string()
    .min(1, "IP address is required")
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "Invalid IP address"
    ),
  role: z.string().max(100).optional().nullable(),
  customerId: z.string().min(1, "Customer is required"),
  osId: z.string().min(1, "Operating system is required"),
  environmentId: z.string().min(1, "Environment is required"),
});

export type ServerInput = z.infer<typeof serverSchema>;

// Component validation
export const componentSchema = z.object({
  serverId: z.string().min(1, "Server is required"),
  typeId: z.string().min(1, "Component type is required"),
});

export type ComponentInput = z.infer<typeof componentSchema>;

// License validation
export const licenseSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  productId: z.string().min(1, "Product is required"),
  typeId: z.string().min(1, "License type is required"),
  environmentId: z.string().min(1, "Environment is required"),
  value: z.string().min(1, "License value is required"),
  expiresAt: z.union([
    z.string().min(1, "Expiration date is required"),
    z.date(),
  ]),
  notes: z.string().max(1000).optional().nullable(),
});

export type LicenseInput = z.infer<typeof licenseSchema>;

// Credential validation
export const credentialSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  serverId: z.string().optional().nullable(),
  username: z.string().min(1, "Username is required").max(255),
  secret: z.string().min(1, "Password/Secret is required"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().max(1000).optional().nullable(),
});

export type CredentialInput = z.infer<typeof credentialSchema>;

// Firewall Rule validation
export const firewallRuleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  srcRole: z.string().max(100).optional().nullable(),
  srcIp: z
    .string()
    .min(1, "Source IP is required")
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[12]?[0-9]))?$/,
      "Invalid IP address or CIDR"
    ),
  dstRole: z.string().max(100).optional().nullable(),
  dstIp: z
    .string()
    .min(1, "Destination IP is required")
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[12]?[0-9]))?$/,
      "Invalid IP address or CIDR"
    ),
  port: z.number().int().min(1).max(65535),
  protocol: z.enum(["TCP", "UDP"]),
  comment: z.string().max(500).optional().nullable(),
});

export type FirewallRuleInput = z.infer<typeof firewallRuleSchema>;

// Project validation
export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().nullable(),
  customerId: z.string().min(1, "Customer is required"),
  ownerId: z.string().optional().nullable(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
