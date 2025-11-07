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
  accountCode?: string;
  projectCode?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
  attachments?: Attachment[];
  Invoice?: {
    id: string;
    invoiceNumber: string;
    Project?: {
      id: string;
      title: string;
    };
  };
  Project?: {
    id: string;
    title: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string;
  status: string;
  paidBy: string;
  notes?: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  publicId: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  size: number;
  uploadedAt: string;
  mimeType: string;
}

export interface UpcomingPayment {
  id: string;
  dueDate: string;
  amount: number;
  description: string;
  status: "PENDING";
}
