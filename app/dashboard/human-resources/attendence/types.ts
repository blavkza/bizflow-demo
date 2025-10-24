import { CheckInMethod, AttendanceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Use Prisma's generated types as base and extend them
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    position: string;
    department?: {
      name: string;
    };
    scheduledKnockIn?: Date | null;
    scheduledKnockOut?: Date | null;
    workingDays?: string[];
  };
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  scheduledKnockIn?: Date | null;
  scheduledKnockOut?: Date | null;
  checkInLat?: Decimal | null;
  checkInLng?: Decimal | null;
  checkOutLat?: Decimal | null;
  checkOutLng?: Decimal | null;
  checkInAddress?: string | null;
  checkOutAddress?: string | null;
  checkInMethod?: CheckInMethod | null;
  regularHours?: Decimal | null;
  overtimeHours?: Decimal | null;
  breakDuration?: number | null;
  status: AttendanceStatus;
  notes?: string | null;
  breakStart?: Date | null;
  breakEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  displayStatus?: string;
  isVirtualRecord?: boolean;
}

export interface CheckInRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeNumber: string;
  employeeAvatar: string;
  method: CheckInMethod;
  location: string;
  address?: string;
  timestamp: string;
  accuracy?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Department {
  id: string;
  name: string;
}

export interface ManualCheckInData {
  employeeId: string;
  location: string;
  notes: string;
}

// Helper type for leave status check - use string literals instead of enum values
export type LeaveStatus = "SICK_LEAVE" | "ANNUAL_LEAVE" | "UNPAID_LEAVE";

// Type guard to check if status is a leave status
export function isLeaveStatus(
  status: AttendanceStatus
): status is Extract<AttendanceStatus, LeaveStatus> {
  return ["SICK_LEAVE", "ANNUAL_LEAVE", "UNPAID_LEAVE"].includes(status);
}
