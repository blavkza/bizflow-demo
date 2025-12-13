"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { UserPermission, UserRole } from "@prisma/client";

import { AttendanceRecord, CheckInRecord, Department } from "./types";
import {
  fetchUserData,
  fetchAttendanceRecords,
  fetchCheckInHistory,
  fetchDepartments,
  hasRole,
} from "./api";
import {
  AttendanceHeader,
  AttendanceTabs,
  BarcodeCheckInDialog,
  ManualCheckInDialog,
  SummaryCards,
} from "./components";

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false);
  const [isBarcodeCheckInOpen, setIsBarcodeCheckInOpen] = useState(false);
  const [checkInType, setCheckInType] = useState<"in" | "out">("in");
  const [isLoading, setIsLoading] = useState(false);

  const { userId } = useAuth();

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  // Fetch attendance records
  const {
    data: attendanceData,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: [
      "attendance-records",
      selectedDate,
      selectedDepartment,
      selectedStatus,
    ],
    queryFn: () =>
      fetchAttendanceRecords(selectedDate, selectedDepartment, selectedStatus),
    enabled: !userLoading,
  });

  // Fetch check-in history
  const { data: checkInHistory, isLoading: checkinsLoading } = useQuery({
    queryKey: ["checkin-history", selectedDate],
    queryFn: () => fetchCheckInHistory(selectedDate, selectedDate),
    enabled: !userLoading,
  });

  // NEW: Fetch Bypass Rules
  const { data: bypassRules = [] } = useQuery({
    queryKey: ["bypass-rules"],
    queryFn: async () => {
      const res = await fetch("/api/attendance-bypass");
      if (!res.ok) return [];
      const data = await res.json();
      return data.bypassRules || [];
    },
    enabled: !userLoading,
  });

  const attendanceRecords: AttendanceRecord[] = attendanceData?.records || [];
  const gpsCheckIns: CheckInRecord[] = checkInHistory?.checkins || [];

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];
  const hasFullAccess = userData?.role
    ? hasRole(userData.role, fullAccessRoles)
    : false;
  const canViewAttendance = userData?.permissions?.includes(
    UserPermission.Attendence_VIEW
  );

  const canCreateAttendance = userData?.permissions?.includes(
    UserPermission.Attendence_CREATE
  );

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">Loading...</div>
    );
  }

  if (!userLoading && canViewAttendance === false && hasFullAccess === false) {
    router.push("/dashboard");
    return null;
  }

  const departmentOptions = [
    "All Departments",
    ...departments.map((d: Department) => d.name),
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AttendanceHeader
        onManualCheckIn={() => setIsManualCheckInOpen(true)}
        onBarcodeCheckIn={() => setIsBarcodeCheckInOpen(true)}
        canCreateAttendance={canCreateAttendance}
        hasFullAccess={hasFullAccess}
      />

      <SummaryCards attendanceRecords={attendanceRecords} />

      <AttendanceTabs
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        departmentOptions={departmentOptions}
        attendanceRecords={attendanceRecords}
        filteredAttendance={attendanceRecords.filter((record) => {
          const personName = record.employee
            ? `${record.employee.firstName} ${record.employee.lastName}`
            : record.freeLancer
              ? `${record.freeLancer.firstName} ${record.freeLancer.lastName}`
              : "";

          const personId = record.employee
            ? record.employee.employeeNumber
            : record.freeLancer?.freeLancerNumber || "";

          const matchesSearch =
            personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            personId.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        })}
        gpsCheckIns={gpsCheckIns}
        recordsLoading={recordsLoading}
        checkinsLoading={checkinsLoading}
        bypassRules={bypassRules} // Passed down
      />

      <ManualCheckInDialog
        open={isManualCheckInOpen}
        onOpenChange={setIsManualCheckInOpen}
        checkInType={checkInType}
        setCheckInType={setCheckInType}
        isLoading={isLoading}
        onCheckIn={async (data) => {
          try {
            setIsLoading(true);
            const endpoint =
              checkInType === "in"
                ? "/api/attendance/check-in"
                : "/api/attendance/check-out";

            const payload: any = {
              location: data.location,
              notes: data.notes,
              method: "MANUAL",
            };

            if (data.employeeId) {
              payload.employeeId = data.employeeId;
            } else if (data.freelancerId) {
              payload.freelancerId = data.freelancerId;
            }

            if (data.lat && data.lng) {
              payload.lat = data.lat;
              payload.lng = data.lng;
              payload.address = data.location;
            }

            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Failed to record check-in");
            }

            toast({
              title: "Success",
              description: `Check-${
                checkInType === "in" ? "in" : "out"
              } recorded successfully`,
            });

            setIsLoading(false);
            setIsManualCheckInOpen(false);
            refetchRecords();
          } catch (error) {
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to record check-in",
              variant: "destructive",
            });
            setIsLoading(false);
          }
        }}
      />

      <BarcodeCheckInDialog
        open={isBarcodeCheckInOpen}
        onOpenChange={setIsBarcodeCheckInOpen}
        checkInType={checkInType}
        setCheckInType={setCheckInType}
        onScan={async (scanData) => {
          try {
            const endpoint =
              checkInType === "in"
                ? "/api/attendance/check-in"
                : "/api/attendance/check-out";

            const { id, address, location, coordinates } = scanData;
            const isFreelancer = id.startsWith("FRL");

            const payload: any = {
              method: "BARCODE",
              address: address || "Scanned via QR",
              location: location || "",
            };

            if (isFreelancer) {
              payload.freelancerId = id;
            } else {
              payload.employeeId = id;
            }

            if (coordinates) {
              payload.lat = coordinates.latitude;
              payload.lng = coordinates.longitude;
            }

            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Failed to record check-in");
            }

            toast({
              title: "Success",
              description: `Check-${
                checkInType === "in" ? "in" : "out"
              } recorded successfully`,
            });

            setIsBarcodeCheckInOpen(false);
            refetchRecords();
          } catch (error) {
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to record check-in",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
