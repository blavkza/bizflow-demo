export interface Expense {
  id: string;
  expenseNumber: string;
  description: string;
  categoryId: string;
  vendorId: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    type: string;
  };
  Vendor?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  expenseDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  invoiceId?: string;
  projectId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    project?: {
      id: string;
      title: string;
    };
  };
  project?: {
    id: string;
    title: string;
  };
}

export interface ComboboxOption {
  label: string;
  value: string;
  type?: string;
  color?: string;
  email?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}
