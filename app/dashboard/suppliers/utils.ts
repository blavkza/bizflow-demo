import * as z from "zod";
import { VendorType } from "./type";
import { VendorStatus } from "@prisma/client";

export const PAYMENT_TERMS = [
  "Due on receipt",
  "Net 7 (Payment In 7 days)",
  "Net 15 (Payment In 15 days)",
  "Net 30 (Payment In 30 days)",
  "Net 45 (Payment In 45 days)",
  "Net 60 (Payment In 60 days)",
  "Net 90 (Payment In 90 days)",
  "50% Advance, 50% on completion",
];

export const NO_CATEGORY_VALUE = "no-category";
export const NO_PAYMENT_TERMS_VALUE = "no-payment-terms";

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  fullName: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  phone2: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  categoryIds: z.array(z.string()).default([]),
  type: z.nativeEnum(VendorType),
  status: z.nativeEnum(VendorStatus),
  paymentTerms: z.string().default(NO_PAYMENT_TERMS_VALUE),
  notes: z.string().optional().or(z.literal("")),
});
