import {
  BillingType,
  CategoryStatus,
  CategoryType,
  ClientStatus,
  ClientType,
  ContractType,
  DepositType,
  DiscountType,
  EmployeeStatus,
  InvoicePaymentStatus,
  InvoiceStatus,
  PackageStatus,
  PackageType,
  PaymentMethod,
  PaymentType,
  Priority,
  ProjectType,
  QuotationStatus,
  RecurringFrequency,
  SalaryType,
  TaskStatus,
  TransactionStatus,
  TransactionType,
  UserPermission,
  UserRole,
  UserStatus,
  UserType,
} from "@prisma/client";
import { optional, z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required!" }),
    userName: z.string().min(1, { message: "Username is required!" }),
    phone: z.string().optional(),
    email: z.string().email({ message: "Invalid email address!" }),
    role: z.nativeEnum(UserRole),
    status: z.nativeEnum(UserStatus),
    userType: z.nativeEnum(UserType),
    employeeId: z.string().optional(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long!" })
      .regex(/[A-Z]/, {
        message: "Must include at least one uppercase letter!",
      })
      .regex(/[a-z]/, {
        message: "Must include at least one lowercase letter!",
      })
      .regex(/\d/, { message: "Must include at least one number!" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Must include at least one special character!",
      }),
    permissions: z.array(z.nativeEnum(UserPermission)).default([]),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    // Employee users must be linked to an employee
    if (data.userType === UserType.EMPLOYEE && !data.employeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee must be selected when user type is Employee",
        path: ["employeeId"],
      });
    }
  });

export type createUserSchemaType = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required!" }),
    phone: z.string().optional(),
    email: z.string().email({ message: "Invalid email address!" }),
    role: z.nativeEnum(UserRole),
    status: z.nativeEnum(UserStatus),
    userType: z.nativeEnum(UserType),
    employeeId: z.string().optional(),
    permissions: z.array(z.nativeEnum(UserPermission)).default([]),
  })
  .superRefine((data, ctx) => {
    // Employee users must be linked to an employee
    if (data.userType === UserType.EMPLOYEE && !data.employeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee must be selected when user type is Employee",
        path: ["employeeId"],
      });
    }
  });

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;

export const clientSchema = z
  .object({
    // Basic Information
    name: z.string().min(1, "Name is required"),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    phone: z.string().min(1, "Phone is required"),
    phone2: z.string().optional().or(z.literal("")),
    type: z.nativeEnum(ClientType),
    status: z.nativeEnum(ClientStatus),

    // Personal Address Information
    address: z.string().optional().or(z.literal("")),
    country: z.string().optional().or(z.literal("")),
    province: z.string().optional().or(z.literal("")),
    town: z.string().optional().or(z.literal("")),
    village: z.string().optional().or(z.literal("")),
    street: z.string().optional().or(z.literal("")),

    // Company Information
    companyFullName: z.string().optional().or(z.literal("")),
    tradingName: z.string().optional().or(z.literal("")),
    registrationNumber: z.string().optional().or(z.literal("")),
    vatNumber: z.string().optional().or(z.literal("")),
    taxNumber: z.string().optional().or(z.literal("")),
    telNo1: z.string().optional().or(z.literal("")),
    telNo2: z.string().optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),

    // Company Address Information
    companyCountry: z.string().optional().or(z.literal("")),
    companyProvince: z.string().optional().or(z.literal("")),
    companytown: z.string().optional().or(z.literal("")),
    companyvillage: z.string().optional().or(z.literal("")),
    companystreet: z.string().optional().or(z.literal("")),
    companyaddress: z.string().optional().or(z.literal("")),
    additionalInfo: z.string().optional().or(z.literal("")),

    // Financial Information
    creditLimit: z.string().optional().or(z.literal("")),
    paymentTerms: z.number().int().positive().optional().nullable(),
    currency: z.string().default("ZAR"),

    // Additional Information
    assignedTo: z.string().optional().or(z.literal("")),
    source: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // If client type is COMPANY, require company full name
      if (data.type === ClientType.COMPANY) {
        return !!data.companyFullName;
      }
      return true;
    },
    {
      message: "Company full name is required for company type",
      path: ["companyFullName"],
    }
  );

export type clientSchemaType = z.infer<typeof clientSchema>;

export const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyAddress: z.string().optional(),
});

export type ContactInfoSchemaType = z.infer<typeof contactInfoSchema>;

export const departmentSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  description: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
});

export type departmentSchemaType = z.infer<typeof departmentSchema>;

export const projectSchema = z.object({
  title: z.string().min(1, { message: "Name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  projectType: z.nativeEnum(ProjectType),
  billingType: z.nativeEnum(BillingType).optional(),
  clientId: z.string().optional(),
  priority: z.nativeEnum(Priority),
  managerId: z.string().min(1, "Team leader is required"),
  startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  deadline: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export type projectSchemaType = z.infer<typeof projectSchema>;

export const subtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  estimatedHours: z.number().optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  dueDate: z
    .union([z.date(), z.string().transform((str) => new Date(str))])
    .optional()
    .nullable()
    .transform((val) => (val instanceof Date ? val : null)),
  estimatedHours: z.number().optional(),
  assigneeIds: z.array(z.string()).optional(),
  freelancerIds: z.array(z.string()).optional(),
  isAIGenerated: z.boolean().optional().default(false),
  subtasks: z.array(subtaskSchema).optional().default([]),
});

export const multiTaskSchema = z.object({
  tasks: z.array(taskSchema).min(1, "At least one task is required"),
});

export type TaskSchemaType = z.infer<typeof taskSchema>;
export type SubtaskSchemaType = z.infer<typeof subtaskSchema>;
export type MultiTaskSchemaType = z.infer<typeof multiTaskSchema>;

export const folderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.string().min(1, "Project is required"),
});

export type foldwerSchemaType = z.infer<typeof folderSchema>;

export const memberSchema = z.object({
  user: z.string().min(1, "Project is required"),
  role: z.string().min(1, "Role is required"),
  projectId: z.string().min(1, "Project is required"),
});

export type MemberSchemaType = z.infer<typeof memberSchema>;

export const employeeSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    email: z
      .string()
      .email({ message: "Invalid email address!" })
      .optional()
      .or(z.literal("")),
    position: z.string().min(1, { message: "Position is required" }),
    departmentId: z.string().min(1, { message: "Department is required" }),
    contractType: z.nativeEnum(ContractType).default("FULL_TIME"),
    salaryType: z.nativeEnum(SalaryType).default("MONTHLY"),
    dailySalary: z.coerce
      .number()
      .min(0, { message: "Daily salary must be positive" })
      .default(0),
    monthlySalary: z.coerce
      .number()
      .min(0, { message: "Monthly salary must be positive" })
      .default(0),
    overtimeHourRate: z.coerce
      .number()
      .min(0, { message: "Overtime rate must be positive" })
      .default(50.0),
    hireDate: z.date({ required_error: "Hire date is required" }),
    terminationDate: z.date().optional().nullable(),
    status: z.nativeEnum(EmployeeStatus).default("ACTIVE"),
    address: z.string().min(1, { message: "Address is required" }),
    city: z.string().or(z.literal("")),
    province: z.string().or(z.literal("")),
    postalCode: z.string().or(z.literal("")),
    country: z.string().or(z.literal("")),
    scheduledKnockIn: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Invalid time format (HH:mm)",
      })
      .optional()
      .or(z.literal("")),
    scheduledKnockOut: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Invalid time format (HH:mm)",
      })
      .optional()
      .or(z.literal("")),
    scheduledWeekendKnockIn: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Invalid time format (HH:mm)",
      })
      .optional()
      .or(z.literal("")),
    scheduledWeekendKnockOut: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Invalid time format (HH:mm)",
      })
      .optional()
      .or(z.literal("")),
    workingDays: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.salaryType === "DAILY" && data.dailySalary <= 0) {
        return false;
      }
      if (data.salaryType === "MONTHLY" && data.monthlySalary <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Salary is required for the selected salary type",
      path: ["salaryType"],
    }
  )
  .refine(
    (data) => {
      // Validate that termination date is after hire date if both are provided
      if (
        data.terminationDate &&
        data.hireDate &&
        data.terminationDate < data.hireDate
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Termination date must be after hire date",
      path: ["terminationDate"],
    }
  );

export type employeeSchemaType = z.infer<typeof employeeSchema>;

export const freelancerSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, { message: "Position is required" }),
  departmentId: z.string().min(1, { message: "Department is required" }),
  salary: z
    .union([
      z
        .string()
        .min(1, { message: "Salary is required" })
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        }),
      z.number().min(0, { message: "Salary must be positive" }),
    ])
    .transform((val) => Number(val)),
  overtimeHourRate: z
    .union([
      z
        .string()
        .min(1, { message: "Overtime rate is required" })
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        }),
      z.number().min(0, { message: "Overtime rate must be positive" }),
    ])
    .transform((val) => Number(val))
    .default(50.0),
  hireDate: z.date({ required_error: "Hire date is required" }),
  terminationDate: z.date().optional().nullable(),
  status: z.nativeEnum(EmployeeStatus).default("ACTIVE"),
  city: z.string().or(z.literal("")),
  province: z.string().or(z.literal("")),
  postalCode: z.string().or(z.literal("")),
  country: z.string().or(z.literal("")),
  address: z.string().min(1, { message: "Address is required" }),
  scheduledKnockIn: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  scheduledKnockOut: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  scheduledWeekendKnockIn: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  scheduledWeekendKnockOut: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  workingDays: z.array(z.string()).default([]),
  reliable: z.boolean().optional(),
});

export type freeLancerSchemaType = z.infer<typeof freelancerSchema>;

export const projectInvoiceSchema = z.object({
  invoiceId: z.string().min(1, { message: "invoiceId is required!" }),
});

export type ProjectInvoiceSchemaType = z.infer<typeof projectInvoiceSchema>;

export const CategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  description: z.string().optional(),
  status: z.nativeEnum(CategoryStatus),
  type: z.nativeEnum(CategoryType),
});

export type categorySchemaType = z.infer<typeof CategorySchema>;

const payrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string(),
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.union([z.number(), z.string()]).transform((val) => Number(val)), // Total amount
      baseAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      overtimeAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      daysWorked: z.number(),
      overtimeHours: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      regularHours: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      description: z.string().optional(),
      departmentId: z.string().optional(),
    })
  ),
  totalAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val)),
});

export type PayrollSchemaType = z.infer<typeof payrollSchema>;

const dateStringSchema = z
  .string()
  .datetime()
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .transform((str) => new Date(str));

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  project: z.string().optional(),
  issueDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  dueDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  status: z.nativeEnum(InvoiceStatus),
  description: z.string().optional(),
  currency: z.string().default("ZAR"),

  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z
          .union([z.number(), z.string()])
          .transform((val) => Number(val)),
        unitPrice: z
          .union([z.number(), z.string()])
          .transform((val) => Number(val)),
        taxRate: z
          .union([z.number(), z.string()])
          .transform((val) => Number(val))
          .optional(),
        shopProductId: z.string().optional().nullable(),
        serviceId: z.string().optional().nullable(),
        itemDiscountType: z.nativeEnum(DiscountType).optional().nullable(),
        itemDiscountAmount: z.number().optional().nullable(),
      })
    )
    .min(1, "At least one item is required"),

  // Financials
  discountType: z.nativeEnum(DiscountType).optional(),
  discountAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional(),
  taxRate: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional(),

  // Deposit (FIXED: Added missing fields)
  depositRequired: z.boolean().default(false),
  depositType: z.nativeEnum(DepositType).optional(),
  depositAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional(),

  // Meta
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),

  // Recurring Options (for the toggle in the main form)
  isRecurring: z.boolean().default(false),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  interval: z.number().min(1).max(365).default(1).optional(),
  endDate: z.date().optional().nullable(),
});

export const RecurringInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  description: z.string().optional(),
  frequency: z.nativeEnum(RecurringFrequency),
  interval: z.number().min(1).max(365).default(1),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional().nullable(),

  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Quantity must be greater than 0"),
        unitPrice: z.number().min(0, "Unit price must be positive"),
        taxRate: z.number().min(0).max(100).default(0),
        shopProductId: z.string().optional().nullable(),
        serviceId: z.string().optional().nullable(),
        itemDiscountType: z.nativeEnum(DiscountType).optional().nullable(),
        itemDiscountAmount: z.number().optional().nullable(),
      })
    )
    .min(1, "At least one item is required"),

  currency: z.string().default("ZAR"),

  discountType: z.nativeEnum(DiscountType).optional(),
  discountAmount: z.number().min(0).optional(),

  // Deposit (FIXED: Added missing fields to Recurring Schema)
  depositRequired: z.boolean().default(false),
  depositType: z.nativeEnum(DepositType).optional(),
  depositAmount: z.number().optional(),

  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type RecurringInvoiceFormData = z.infer<typeof RecurringInvoiceSchema>;

export const invoicePaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Amount must be a positive number"
    )
    .transform((val) => parseFloat(val)),
  currency: z.string().default("ZAR"),
  method: z.nativeEnum(PaymentMethod, {
    required_error: "Payment method is required",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .nativeEnum(InvoicePaymentStatus)
    .default(InvoicePaymentStatus.COMPLETED),
  paidAt: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export type InvoicePaymentSchemaType = z.infer<typeof invoicePaymentSchema>;

export const QuotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be at least 0.01"),
  unitPrice: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
  shopProductId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  itemDiscountType: z.enum(["AMOUNT", "PERCENTAGE"]).optional(),
  itemDiscountAmount: z.number().min(0).optional(),
});

export const QuotationSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  shopProductId: z.string().optional(),
  departmentId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  issueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid issue date format",
  }),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid valid until date format",
  }),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1, "At least one item is required"),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountAmount: z.number().min(0).optional(),
  status: z.nativeEnum(QuotationStatus).optional().default("DRAFT"),
  depositRequired: z.boolean().default(false),
  depositType: z.enum(["AMOUNT", "PERCENTAGE"]).optional(),
  depositAmount: z.number().min(0).optional(),
});

export const PRODUCT_CATEGORIES = [
  "Solar Panel",
  "Inverter",
  "Battery",
  "Mounting System",
  "Accessories",
] as const;

export const productSchema = z.object({
  category: z.string().min(1, "Category is required"),
  size: z.string().min(1, "Size/Dimensions are required"),
  price: z.number().min(0, "Price must be a positive number"),
  panels: z.number().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const GeneralSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  taxId: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  phone2: z.string().optional(),
  phone3: z.string().optional(),
  website: z.string().optional(),
  paymentTerms: z.string().optional(),
  note: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccount2: z.string().optional(),
  bankName: z.string().optional(),
  bankName2: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postCode: z.string().min(1, "Post code is required"),

  deliveryNoteNote: z.string().optional(),
  deliveryNoteTerms: z.string().optional(),
  purchaseOrderNote: z.string().optional(),
  purchaseOrderTerms: z.string().optional(),
  proFormaNote: z.string().optional(),
  proFormaTerms: z.string().optional(),
  creditNoteNote: z.string().optional(),
  creditNoteTerms: z.string().optional(),
  supplierListNote: z.string().optional(),
  supplierListTerms: z.string().optional(),
});

export type GeneralSettingsSchemaType = z.infer<typeof GeneralSettingsSchema>;

// Validation Schema
export const HRSettingsSchema = z.object({
  // Payroll Settings
  paymentDay: z.number().min(1).max(31),
  paymentMonth: z.string(),
  autoProcessPayroll: z.boolean(),
  workingDaysPerMonth: z.number().min(1).max(31),
  overtimeHourRate: z.number().min(1),

  // Attendance Settings
  workingHoursPerDay: z.number().min(1).max(24),
  lateThreshold: z.number().min(1),
  halfDayThreshold: z.number().min(0.5),
  overtimeThreshold: z.number().min(1),

  // Leave Settings
  annualLeaveDays: z.number().min(0),
  sickLeaveDays: z.number().min(0),
  studyLeaveDays: z.number().min(0),
  maternityLeaveDays: z.number().min(0),
  paternityLeaveDays: z.number().min(0),
  carryOverEnabled: z.boolean(),
  maxCarryOverDays: z.number().min(0),

  // Bonus Settings
  annualBonusEnabled: z.boolean(),
  annualBonusType: z.enum(["DECEMBER", "BIRTH_MONTH"]),
  annualBonusPercentage: z.number().min(0).max(500),
  performanceBonusEnabled: z.boolean(),
  performanceBonusType: z.enum(["INDIVIDUAL", "TEAM"]),
  profitSharingEnabled: z.boolean(),
  profitSharingPercentage: z.number().min(0).max(100),
  thirteenthChequeEnabled: z.boolean(),
  spotBonusEnabled: z.boolean(),
  meritBonusEnabled: z.boolean(),
  appreciationBonusEnabled: z.boolean(),
  incentivePaymentEnabled: z.boolean(),
  recognitionAwardEnabled: z.boolean(),

  // Deduction Settings
  uniformPPEEnabled: z.boolean(),
  uniformPPEMaxDeduction: z.number().min(0),
  damageLossEnabled: z.boolean(),
  damageLossMaxPercentage: z.number().min(0).max(100),
  uifEnabled: z.boolean(),
  uifPercentage: z.number().min(0).max(10),
  pensionEnabled: z.boolean(),
  pensionPercentage: z.number().min(0).max(50),
  medicalAidEnabled: z.boolean(),
  medicalAidMaxDeduction: z.number().min(0),
  overpaymentEnabled: z.boolean(),
  overpaymentMaxPercentage: z.number().min(0).max(100),
  loanRepaymentEnabled: z.boolean(),
  funeralBenefitEnabled: z.boolean(),
  funeralBenefitAmount: z.number().min(0),
  tradeUnionEnabled: z.boolean(),
  insuranceEnabled: z.boolean(),
  guaranteeFundEnabled: z.boolean(),
  savingsEnabled: z.boolean(),
  savingsMaxPercentage: z.number().min(0).max(100),
  disciplinaryEnabled: z.boolean(),
  disciplinaryMaxPercentage: z.number().min(0).max(100),
  courtOrderEnabled: z.boolean(),
});

export type HRSettingsSchemaType = z.infer<typeof HRSettingsSchema>;

export const transactionSchema = z.object({
  amount: z.union([
    z.number().positive("Amount must be positive"),
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Not a valid number",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  ]),
  currency: z.string().default("ZAR"),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
  date: z.date(),
  invoiceId: z.string().optional(),
  categoryId: z.string().optional(),
  clientId: z.string().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  vendor: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const transactionCeoSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus).optional(),
  description: z.string().min(1, "Description is required"),
  date: z.date(),
  categoryCeoId: z.string().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  vendor: z.string().optional(),
  reference: z.string().optional(),
});

export type TransactionCeoFormValues = z.infer<typeof transactionCeoSchema>;

export const TeamRole = z.enum([
  "MEMBER",
  "LEADER",
  "CONTRIBUTOR",
  "REVIEWER",
  "FINANCIAL",
]);
export type TeamRole = z.infer<typeof TeamRole>;

export const ProjectTeamMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: TeamRole,
  permissions: z
    .object({
      tasks: z
        .object({
          create: z.boolean().default(false),
          edit: z.boolean().default(false),
          delete: z.boolean().default(false),
        })
        .default({}),
      invoices: z
        .object({
          create: z.boolean().default(false),
          edit: z.boolean().default(false),
          view: z.boolean().default(false),
        })
        .default({}),
      files: z
        .object({
          upload: z.boolean().default(false),
          delete: z.boolean().default(false),
        })
        .default({}),
      financial: z
        .object({
          view: z.boolean().default(false),
          edit: z.boolean().default(false),
        })
        .default({}),
    })
    .default({}),
});

export const ProjectTeamCreateSchema = z.array(ProjectTeamMemberSchema);
export type ProjectTeamCreateSchema = z.infer<typeof ProjectTeamCreateSchema>;

const TAX_RATE = 0.15; // 15% VAT

const DocumentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.enum(["PDF", "DOCUMENT", "IMAGE", "OTHER"]),
  size: z.number(),
  mimeType: z.string(),
});

export const ShopProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().default(""),
    sku: z.string().min(1, "SKU is required"),
    category: z.string().min(1, "Category is required"),
    venderId: z.string().optional(),

    priceInputMode: z.enum(["BEFORE_TAX", "AFTER_TAX"]).default("AFTER_TAX"),

    // Price Fields - ensure they always have values
    price: z.coerce
      .number()
      .min(0, "Price must be a positive number")
      .default(0),
    costPrice: z.coerce
      .number()
      .min(0, "Cost price must be a positive number")
      .nullable()
      .default(null),

    // Price Fields (new before-tax) - with defaults
    priceBeforeTax: z.coerce
      .number()
      .min(0, "Price must be a positive number")
      .default(0),

    costPriceBeforeTax: z.coerce
      .number()
      .min(0, "Cost must be a positive number")
      .nullable()
      .default(null),

    // Inventory
    stock: z.coerce.number().default(0),
    minStock: z.coerce
      .number()
      .min(0, "Minimum stock must be a positive number")
      .default(0),
    maxStock: z.coerce
      .number()
      .min(0, "Maximum stock must be a positive number")
      .default(0),

    // Product Details
    weight: z.coerce
      .number()
      .min(0, "Weight must be a positive number")
      .default(0),
    dimensions: z.string().default(""),
    color: z.string().default(""),
    size: z.string().default(""),
    brand: z.string().default(""),

    // Status
    status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]),
    featured: z.boolean().default(false),

    // Images
    images: z.array(z.string()).default([]),
    documents: z.array(DocumentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // Ensure price calculations are correct
    if (data.priceInputMode === "AFTER_TAX") {
      const calculatedBeforeTax = data.price / (1 + TAX_RATE);

      if (
        data.priceBeforeTax !== undefined &&
        Math.abs(data.priceBeforeTax - calculatedBeforeTax) > 0.01
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price before tax doesn't match calculated value",
          path: ["priceBeforeTax"],
        });
      }
    } else {
      const calculatedAfterTax = (data.priceBeforeTax || 0) * (1 + TAX_RATE);

      if (Math.abs(data.price - calculatedAfterTax) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price after tax doesn't match calculated value",
          path: ["price"],
        });
      }
    }
  });

export type ShopProductSchemaType = z.infer<typeof ShopProductSchema>;

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  vendorEmail: z.string().email().optional().or(z.literal("")),
  vendorPhone: z.string().optional(),
  totalAmount: z
    .union([
      z.number().min(0.01, "Amount must be greater than 0"),
      z
        .string()
        .min(1)
        .transform((val) => parseFloat(val)),
    ])
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be greater than 0",
    }),
  paidAmount: z
    .union([
      z.number().min(0),
      z.string().transform((val) => parseFloat(val) || 0),
    ])
    .refine((val) => !isNaN(val), {
      message: "Please enter a valid number",
    })
    .default(0),
  dueDate: z.date(),
  paidDate: z.date().optional().nullable(),
  paymentMethod: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).default("PENDING"),
  notes: z.string().optional(),
  expenseDate: z.date(),
  invoiceId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  accountCode: z.string().optional(),
  projectCode: z.string().optional(),
  attachments: z.array(z.any()).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const packageFormSchema = z.object({
  name: z
    .string()
    .min(3, "Package name must be at least 3 characters")
    .max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional()
    .or(z.literal("")),
  shortDescription: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, "category id is requad"),
  status: z.nativeEnum(PackageStatus).default(PackageStatus.DRAFT),
  featured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  thumbnail: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  benefits: z.string().optional().or(z.literal("")),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;
