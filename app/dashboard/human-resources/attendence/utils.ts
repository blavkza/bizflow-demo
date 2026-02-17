import { Decimal } from "@prisma/client/runtime/library";
import { CheckInMethod, AttendanceStatus } from "@prisma/client";
import { AttendanceRecord } from "./types";

// Helper function to convert Decimal to number - more robust version
export function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0;

  // If it's already a number, return it
  if (typeof value === "number") return value;

  // If it's a string that can be converted to a number
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  // If it's a Prisma Decimal object
  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  // If it's a bigint or other numeric type
  if (typeof value === "bigint") {
    return Number(value);
  }

  // Fallback: try to convert to number
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Alternative simpler version if the above doesn't work
export function safeDecimalToNumber(value: any): number {
  try {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;

    // Handle Prisma Decimal
    if (value && typeof value.toNumber === "function") {
      return value.toNumber();
    }

    return Number(value) || 0;
  } catch {
    return 0;
  }
}

// Helper function to check if status is a leave status
export function isLeaveStatus(status: AttendanceStatus): boolean {
  const leaveStatuses: AttendanceStatus[] = [
    AttendanceStatus.SICK_LEAVE,
    AttendanceStatus.ANNUAL_LEAVE,
    AttendanceStatus.UNPAID_LEAVE,
    AttendanceStatus.MATERNITY_LEAVE,
    AttendanceStatus.PATERNITY_LEAVE,
    AttendanceStatus.STUDY_LEAVE,
  ];
  return leaveStatuses.includes(status);
}

// Helper function to format date for display
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString();
  }
  return date.toLocaleDateString();
}

// Helper function to format time for display
export function formatTime(time: Date | string | null): string {
  if (!time) return "N/A";

  try {
    // If it's already a Date object
    if (time instanceof Date) {
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // If it's a string in "HH:mm" format
    if (typeof time === "string") {
      // Check if it's in HH:mm format (e.g., "09:00")
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        const [hours, minutes] = time.split(":").map(Number);
        // Create a date object with today's date and the specified time
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }

      // If it's an ISO string or other date format, try to parse it
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    return "N/A";
  } catch (error) {
    console.error("Error formatting time:", error);
    return "N/A";
  }
}

export function getStatusColor(
  status: AttendanceStatus,
  displayStatus?: string,
): string {
  if (
    displayStatus?.includes("Not Checked In") &&
    status !== AttendanceStatus.ABSENT
  ) {
    return "bg-blue-100 text-blue-800";
  }

  switch (status) {
    case AttendanceStatus.PRESENT:
      return "bg-green-100 text-green-800";
    case AttendanceStatus.LATE:
      return "bg-yellow-100 text-yellow-800";
    case AttendanceStatus.ABSENT:
      return "bg-red-100 text-red-800";
    case AttendanceStatus.ANNUAL_LEAVE:
      return "bg-blue-100 text-blue-800";
    case AttendanceStatus.SICK_LEAVE:
    case AttendanceStatus.UNPAID_LEAVE:
      return "bg-purple-100 text-purple-800";
    case AttendanceStatus.HALF_DAY:
      return "bg-orange-100 text-orange-800";
    case AttendanceStatus.ON_BREAK as any:
      return "bg-orange-50 text-orange-600 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Return icon names instead of JSX - components will handle the actual rendering
export function getStatusIconName(status: AttendanceStatus): string {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "CheckCircle";
    case AttendanceStatus.LATE:
      return "Clock";
    case AttendanceStatus.ABSENT:
      return "AlertTriangle";
    case AttendanceStatus.ANNUAL_LEAVE:
    case AttendanceStatus.SICK_LEAVE:
    case AttendanceStatus.UNPAID_LEAVE:
    case AttendanceStatus.MATERNITY_LEAVE:
    case AttendanceStatus.PATERNITY_LEAVE:
    case AttendanceStatus.STUDY_LEAVE:
      return "Calendar";
    case AttendanceStatus.HALF_DAY:
      return "Clock";
    case AttendanceStatus.ON_BREAK as any:
      return "Coffee";
    default:
      return "Clock";
  }
}

export function getStatusDisplayName(
  status: AttendanceStatus,
  record?: AttendanceRecord,
): string {
  // Check if it's an approved leave record from notes
  // Note: record as any to bypass TS if needed, but notes is in AttendanceRecord
  if (record?.notes?.startsWith("Approved Leave: ")) {
    const leaveType = record.notes.replace("Approved Leave: ", "");
    // Format COMPASSIONATE -> Compassionate Leave, SICK -> Sick Leave, etc.
    return (
      leaveType.charAt(0).toUpperCase() +
      leaveType.slice(1).toLowerCase().replace(/_/g, " ") +
      " Leave"
    );
  }

  switch (status) {
    case AttendanceStatus.PRESENT:
      return "Present";
    case AttendanceStatus.LATE:
      return "Late";
    case AttendanceStatus.ABSENT:
      return "Absent";
    case AttendanceStatus.ANNUAL_LEAVE:
      return "Annual Leave";
    case AttendanceStatus.SICK_LEAVE:
      return "Sick Leave";
    case AttendanceStatus.UNPAID_LEAVE:
      return "Unpaid Leave";
    case AttendanceStatus.MATERNITY_LEAVE:
      return "Maternity Leave";
    case AttendanceStatus.PATERNITY_LEAVE:
      return "Paternity Leave";
    case AttendanceStatus.STUDY_LEAVE:
      return "Study Leave";
    case AttendanceStatus.HALF_DAY:
      return "Half Day";
    case AttendanceStatus.ON_BREAK as any:
      return "On Break";
    default:
      return status;
  }
}

export function getCheckInMethodColor(method: CheckInMethod): string {
  switch (method) {
    case CheckInMethod.GPS:
      return "bg-blue-100 text-blue-800";
    case CheckInMethod.MANUAL:
      return "bg-purple-100 text-purple-800";
    case CheckInMethod.BARCODE:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Return icon names instead of JSX
export function getCheckInMethodIconName(method: CheckInMethod): string {
  switch (method) {
    case CheckInMethod.GPS:
      return "MapPin";
    case CheckInMethod.MANUAL:
      return "UserCheck";
    case CheckInMethod.BARCODE:
      return "QrCode";
    default:
      return "Clock";
  }
}

export const statusOptions = [
  "All Status",
  "Present",
  "Late",
  "Absent",
  "Annual Leave",
  "Sick Leave",
  "Unpaid Leave",
  "Half Day",
  "On Break",
];
export function getDisplayStatus(record: AttendanceRecord): string {
  if (record.displayStatus) {
    return record.displayStatus;
  }

  const isVirtual =
    record.isVirtualRecord ||
    record.id.startsWith("virtual-") ||
    !record.checkIn;

  if (!isVirtual) {
    return getStatusDisplayName(record.status, record);
  }

  // For virtual records (no actual attendance record)
  const now = new Date();
  const recordDate = new Date(record.date);
  const isToday = now.toDateString() === recordDate.toDateString();

  // If it's not today, it's Absent
  if (!isToday) {
    return "Absent";
  }

  // If it's a leave status
  if (isLeaveStatus(record.status)) {
    return getStatusDisplayName(record.status, record);
  }

  // For today, non-leave virtual records
  const person =
    (record as any).employee ||
    (record as any).freeLancer ||
    (record as any).trainer;
  const scheduledKnockIn = person?.scheduledKnockIn;

  if (!scheduledKnockIn) {
    return "No Schedule";
  }

  const scheduledTime = new Date(scheduledKnockIn);
  const todayScheduled = new Date();
  todayScheduled.setHours(
    scheduledTime.getHours(),
    scheduledTime.getMinutes(),
    0,
    0,
  );

  const gracePeriod = new Date(todayScheduled.getTime() + 15 * 60000);

  if (now < todayScheduled) {
    return "Not Checked In";
  } else if (now <= gracePeriod) {
    return "Not Checked In";
  } else if (now <= new Date(todayScheduled.getTime() + 8 * 60 * 60000)) {
    return "Not Checked In - Late";
  } else {
    return "Absent";
  }
}
