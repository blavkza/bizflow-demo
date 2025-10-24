import { AttendanceStatus, CheckInMethod } from "@prisma/client";

export { AttendanceStatus, CheckInMethod };

export const LEAVE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.SICK_LEAVE,
  AttendanceStatus.ANNUAL_LEAVE,
  AttendanceStatus.UNPAID_LEAVE,
];

export function isLeaveStatus(status: AttendanceStatus): boolean {
  return LEAVE_STATUSES.includes(status);
}

export type LeaveStatus = (typeof LEAVE_STATUSES)[number];
