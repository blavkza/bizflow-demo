import { UserRole } from "@prisma/client";
import { Department } from "./types";

export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

export async function fetchAttendanceRecords(
  date: string,
  department?: string,
  status?: string,
) {
  const params = new URLSearchParams({ date });
  if (department && department !== "All Departments")
    params.append("department", department);
  if (status && status !== "All Status") params.append("status", status);

  const response = await fetch(`/api/attendance/records?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch attendance records");
  }
  return response.json();
}

export async function fetchCheckInHistory(
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetch(`/api/attendance/checkins?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch check-in history");
  }
  return response.json();
}

export async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch("/api/departments/all-departments");
  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }
  return response.json();
}

export async function fetchCallOutHistory(date?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);

  const response = await fetch(`/api/attendance/callout?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch call out history");
  }
  return response.json();
}

export const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};
