export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  comments?: string;
  department: string;
  requestedBy?: string;
}

export interface LeaveBalances {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  study: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  position: string;
  department: { name: string } | null;
  isHR: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

export interface ComboboxOption {
  label: string;
  value: string;
}

export const leaveTypes = [
  { value: "ANNUAL", label: "Annual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
  { value: "STUDY", label: "Study Leave" },
  { value: "UNPAID", label: "Unpaid Leave" },
  { value: "COMPASSIONATE", label: "Compassionate Leave" },
] as const;

export interface LeaveRequestFormProps {
  employees: ComboboxOption[];
  onSubmit: (data: any) => Promise<boolean> | Promise<void> | void;
  onCancel: () => void;
}
