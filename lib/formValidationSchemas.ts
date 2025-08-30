import {
  CategoryStatus,
  CategoryType,
  ClientType,
  DiscountType,
  EmployeeStatus,
  InvoicePaymentStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentType,
  Priority,
  QuotationStatus,
  TaskStatus,
  TransactionStatus,
  TransactionType,
  UserPermission,
  UserRole,
  UserStatus,
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
  });

export type createUserSchemaType = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address!" }),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  permissions: z.array(z.nativeEnum(UserPermission)).default([]),
});

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;

export const clientSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  company: z.string().optional(),
  phone: z.string().min(1, { message: "Phone is required!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  type: z.nativeEnum(ClientType),
  taxNumber: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
});

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
  description: z.string().min(1, { message: "Description is required!" }),
  managerId: z.string().optional(),
  location: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
});

export type departmentSchemaType = z.infer<typeof departmentSchema>;

export const projectSchema = z.object({
  title: z.string().min(1, { message: "Name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  clientId: z.string().optional(),
  priority: z.nativeEnum(Priority),
  managerId: z.string().min(1, "Manager is required"),
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

export const employeeSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  email: z.string().email({ message: "Invalid email address!" }).optional(),
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
  hireDate: z.date({ required_error: "Hire date is required" }),
  status: z.nativeEnum(EmployeeStatus).default("ACTIVE"),
  address: z.string().min(1, { message: "Address is required" }),
});

export const projectInvoiceSchema = z.object({
  invoiceId: z.string().min(1, { message: "invoiceId is required!" }),
});

export type ProjectInvoiceSchemaType = z.infer<typeof projectInvoiceSchema>;

export type employeeSchemaType = z.infer<typeof employeeSchema>;

export const CategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }),
  description: z.string().optional(),
  status: z.nativeEnum(CategoryStatus),
  type: z.nativeEnum(CategoryType),
});

export type categorySchemaType = z.infer<typeof CategorySchema>;

export const PayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
});

export type PayrollSchemaType = z.infer<typeof PayrollSchema>;

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  project: z.string().optional(),
  issueDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  dueDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  status: z.nativeEnum(InvoiceStatus),
  description: z.string().optional(),
  currency: z.string().default("ZAR"),
  items: z.array(
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
    })
  ),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional(),
  taxRate: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

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
});

export const QuotationSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
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
});

export type GeneralSettingsSchemaType = z.infer<typeof GeneralSettingsSchema>;

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
