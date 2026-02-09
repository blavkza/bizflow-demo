export interface Tool {
  id: string;
  name: string;
  description?: string | null;
  serialNumber?: string | null;
  code?: string | null;
  category?: string | null;
  purchasePrice: number | string | null;
  purchaseDate?: string | null;
  salePrice?: number | string | null;
  quantity?: number;
  rentalRateDaily?: number | string | null;
  rentalRateWeekly?: number | string | null;
  rentalRateMonthly?: number | string | null;
  status:
    | "AVAILABLE"
    | "RENTED"
    | "MAINTENANCE"
    | "RETIRED"
    | "ALLOCATED"
    | "DAMAGED"
    | "LOST"
    | "RETURNED"
    | "PENDING_RETURN"
    | "NOT_AVAILABLE"
    | "INTERUSE";
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  primaryImage?: string | null;
  images?: string[] | null;
  parentToolId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  canBeRented?: boolean;
  rentals?: ToolRental[];
  InterUse?: ToolInterUse[];
  maintenanceLogs?: ToolMaintenanceLog[];
  rentalRequests?: RentalRequest[];
}

export interface ToolMaintenanceLog {
  id: string;
  toolId: string;
  maintenanceType: string;
  cost: number | string | null;
  maintenanceDate: string;
  notes?: string | null;
  assignedTo?: string | null;
  processedBy?: string | null;
  createdAt: string;
}

export interface ToolInterUse {
  id: string;
  toolId: string;
  projectId?: string | null;
  project?: Project | null;
  useStartDate: string;
  useEndDate: string;
  relisedBy: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  damageReported: boolean;
  damageDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  toolInterUses?: ToolInterUse[];
}

export interface ToolRental {
  id: string;
  toolId: string;
  businessName: string;
  renterContact?: string | null;
  renterEmail?: string | null;
  renterPhone?: string | null;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalRate: number | string | null;
  rentalDays?: number | null;
  totalCost?: number | string | null;
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
  amountPaid: number | string | null;
  remainingAmount?: number | string | null;
  paidDate?: string | null;
  status:
    | "PENDING"
    | "ACTIVE"
    | "OVERDUE"
    | "COMPLETED"
    | "CANCELLED"
    | "RETURNED_DAMAGED";
  notes?: string | null;
  returnCondition?: string | null;
  damageReported: boolean;
  damageDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RentalRequest {
  id: string;
  toolId?: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  requesterBusiness: string;
  requestedStartDate: string;
  requestedEndDate: string;
  rentalDays?: number | null;
  estimatedCost?: number | string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  purpose?: string | null;
  specialRequirements?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  url: string;
  name: string;
  type: "IMAGE" | "PDF" | "DOCUMENT" | "OTHER";
  size: number;
  mimeType: string;
}
