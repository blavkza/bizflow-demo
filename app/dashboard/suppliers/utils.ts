import * as z from "zod";
import { VendorType } from "./type";
import { VendorStatus } from "@prisma/client";

export const PAYMENT_TERMS = [
  "Due on receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "2/10 Net 30",
  "50% Advance, 50% on completion",
];

export const NO_CATEGORY_VALUE = "no-category";
export const NO_PAYMENT_TERMS_VALUE = "no-payment-terms";

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
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
