import { z } from "zod";

// Base lookup schema
const baseLookupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// Product
export const productSchema = baseLookupSchema;
export type ProductInput = z.infer<typeof productSchema>;

// Environment
export const environmentSchema = baseLookupSchema.extend({
  order: z.coerce.number().int().min(0).default(0),
});
export type EnvironmentInput = z.infer<typeof environmentSchema>;

// Operating System
export const operatingSystemSchema = baseLookupSchema;
export type OperatingSystemInput = z.infer<typeof operatingSystemSchema>;

// Component Type
export const componentTypeSchema = baseLookupSchema;
export type ComponentTypeInput = z.infer<typeof componentTypeSchema>;

// License Type
export const licenseTypeSchema = baseLookupSchema.extend({
  isJwt: z.boolean().default(false),
});
export type LicenseTypeInput = z.infer<typeof licenseTypeSchema>;

// Valid lookup types
export const lookupTypes = [
  "products",
  "environments",
  "operating-systems",
  "component-types",
  "license-types",
] as const;

export type LookupType = (typeof lookupTypes)[number];

export function isValidLookupType(type: string): type is LookupType {
  return lookupTypes.includes(type as LookupType);
}

export function getSchemaForType(type: LookupType) {
  switch (type) {
    case "products":
      return productSchema;
    case "environments":
      return environmentSchema;
    case "operating-systems":
      return operatingSystemSchema;
    case "component-types":
      return componentTypeSchema;
    case "license-types":
      return licenseTypeSchema;
    default:
      return baseLookupSchema;
  }
}
