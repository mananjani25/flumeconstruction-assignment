import { z } from "zod";
import { PROJECT_STATUSES } from "./format";

// Request body schemas. Kept in one place so routes and the client can share
// the same shape and error messages.

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  country: z.string().trim().min(1, "Country is required"),
  website: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  unitPrice: z.coerce.number().nonnegative("Price cannot be negative"),
  currency: z.string().trim().min(1).default("USD"),
  unitOfMeasure: z.string().trim().min(1, "Unit of measure is required"),
  leadTimeDays: z.coerce.number().int().min(0, "Lead time cannot be negative"),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  buyerName: z.string().trim().min(1, "Buyer/client name is required"),
});

export const projectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
});

export const specItemCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitOfMeasure: z.string().trim().min(1, "Unit of measure is required"),
});

export const sourcingOptionCreateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  // Optional overrides; default to the product's catalog values server-side.
  quotedPrice: z.coerce.number().nonnegative().optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
});

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type SpecItemCreateInput = z.infer<typeof specItemCreateSchema>;
export type SourcingOptionCreateInput = z.infer<
  typeof sourcingOptionCreateSchema
>;
