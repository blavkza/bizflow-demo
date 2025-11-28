import { CheckInMethod, AttendanceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Use the exact same structure as Prisma expects
export interface AttendanceRecord {
  id: string;
  employeeId: string | null;
  freeLancerId: string | null;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    position: string;
    department?: {
      name: string;
    } | null;
    scheduledKnockIn: string | null;
    scheduledKnockOut: string | null;
    workingDays: string[];
  } | null;
  freeLancer?: {
    id: string;
    freeLancerNumber: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    position: string;
    department?: {
      name: string;
    } | null;
    scheduledKnockIn: string | null;
    scheduledKnockOut: string | null;
    workingDays: string[];
  } | null;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  scheduledKnockIn: string | null;
  scheduledKnockOut: string | null;
  checkInLat: Decimal | null;
  checkInLng: Decimal | null;
  checkOutLat: Decimal | null;
  checkOutLng: Decimal | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  checkInMethod: CheckInMethod | null;
  regularHours: Decimal | null;
  overtimeHours: Decimal | null;
  breakDuration: number | null;
  status: AttendanceStatus;
  notes: string | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  displayStatus?: string;
  isVirtualRecord?: boolean;
  personType?: "employee" | "freelancer";
}

export interface CheckInRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeNumber: string;
  employeeAvatar: string | null;
  personType: "employee" | "freelancer";
  method: CheckInMethod;
  location: string;
  address?: string;
  timestamp: string;
  accuracy?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Check-out fields
  checkOutTimestamp?: string | null;
  checkOutAddress?: string | null;
  checkOutCoordinates?: {
    lat: number;
    lng: number;
  };
  checkOutMethod?: string | null;
  // Additional fields
  regularHours?: number | null;
  overtimeHours?: number | null;
  status?: string;
  notes?: string | null;
}

export interface Department {
  id: string;
  name: string;
}

export interface ManualCheckInData {
  employeeId?: string;
  freelancerId?: string;
  location: string;
  notes: string;
  lat?: number;
  lng?: number;
}

export type LeaveStatus = "SICK_LEAVE" | "ANNUAL_LEAVE" | "UNPAID_LEAVE";

export function isLeaveStatus(
  status: AttendanceStatus
): status is Extract<AttendanceStatus, LeaveStatus> {
  return ["SICK_LEAVE", "ANNUAL_LEAVE", "UNPAID_LEAVE"].includes(status);
}
