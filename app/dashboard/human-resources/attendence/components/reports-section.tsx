import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, UserCheck, QrCode, Zap, Moon } from "lucide-react";
import { AttendanceRecord } from "../types";
import { safeDecimalToNumber } from "../utils";

interface ReportsSectionProps {
  attendanceRecords: AttendanceRecord[];
}

export function ReportsSection({ attendanceRecords }: ReportsSectionProps) {
  // Helper function to check if status is a leave status
  const isLeaveStatus = (status: string): boolean => {
    return ["SICK_LEAVE", "ANNUAL_LEAVE", "UNPAID_LEAVE"].includes(status);
  };

  // Helper function to check if record is a night shift
  const isNightShift = (record: AttendanceRecord): boolean => {
    if (!record.checkIn || !record.checkOut) return false;

    const checkInDate = new Date(record.checkIn);
    const checkOutDate = new Date(record.checkOut);

    return checkInDate.getDate() !== checkOutDate.getDate();
  };

  // Helper function to check if bypass was applied
  const hasBypass = (record: AttendanceRecord): boolean => {
    if (
      record.notes?.toLowerCase().includes("bypass") ||
      record.notes?.toLowerCase().includes("custom time") ||
      record.notes?.toLowerCase().includes("restrictions bypassed")
    ) {
      return true;
    }

    // Check time difference as another indicator
    if (record.checkIn && record.scheduledKnockIn) {
      try {
        const checkInHour = new Date(record.checkIn).getHours();
        const scheduledHour = parseInt(record.scheduledKnockIn.split(":")[0]);

        if (Math.abs(checkInHour - scheduledHour) > 2) {
          return true;
        }
      } catch (error) {
        // If parsing fails, ignore
      }
    }

    return false;
  };

  // Calculate totals
  const totalEmployees = attendanceRecords.filter(
    (record) => record.employeeId,
  ).length;
  const totalFreelancers = attendanceRecords.filter(
    (record) => record.freeLancerId,
  ).length;
  const totalTrainers = attendanceRecords.filter(
    (record) => record.trainerId,
  ).length;
  const totalPersons = attendanceRecords.length;

  // Status breakdown
  const presentPersons = attendanceRecords.filter(
    (r) => r.status === "PRESENT",
  ).length;

  const latePersons = attendanceRecords.filter(
    (r) => r.status === "LATE",
  ).length;

  const absentPersons = attendanceRecords.filter(
    (r) => r.status === "ABSENT",
  ).length;

  const halfDayPersons = attendanceRecords.filter(
    (r) => r.status === "HALF_DAY",
  ).length;

  const onLeavePersons = attendanceRecords.filter((r) =>
    isLeaveStatus(r.status),
  ).length;

  // Hours calculations
  const totalHours = attendanceRecords.reduce(
    (sum, r) =>
      sum +
      safeDecimalToNumber(r.regularHours || 0) +
      safeDecimalToNumber(r.overtimeHours || 0),
    0,
  );

  const totalOvertimeHours = attendanceRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.overtimeHours || 0),
    0,
  );

  const totalRegularHours = attendanceRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.regularHours || 0),
    0,
  );

  // Calculate overtime pay (using default rate)
  const totalOvertimePay = attendanceRecords.reduce((sum, r) => {
    const overtimeHours = safeDecimalToNumber(r.overtimeHours || 0);
    return overtimeHours > 0 ? sum + overtimeHours * 50 : sum;
  }, 0);

  // Check-in methods breakdown
  const gpsCheckIns = attendanceRecords.filter(
    (r) => r.checkInMethod === "GPS",
  ).length;

  const manualCheckIns = attendanceRecords.filter(
    (r) => r.checkInMethod === "MANUAL",
  ).length;

  const barcodeCheckIns = attendanceRecords.filter(
    (r) => r.checkInMethod === "BARCODE",
  ).length;

  // Additional metrics
  const nightShifts = attendanceRecords.filter(isNightShift).length;
  const bypassApplied = attendanceRecords.filter(hasBypass).length;

  // Calculate attendance rate
  const attendanceRate =
    totalPersons > 0
      ? ((presentPersons + latePersons + halfDayPersons) / totalPersons) * 100
      : 0;

  // Calculate average hours per person
  const averageHoursPerPerson =
    totalPersons > 0 ? totalHours / totalPersons : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Attendance Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>Daily attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Persons</span>
              <span className="font-semibold">{totalPersons}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Employees</span>
              <span className="font-semibold">{totalEmployees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Freelancers</span>
              <span className="font-semibold">{totalFreelancers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trainers</span>
              <span className="font-semibold">{totalTrainers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Attendance Rate</span>
              <span className="font-semibold text-green-600">
                {attendanceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Present</span>
              <span className="font-semibold text-green-600">
                {presentPersons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Late</span>
              <span className="font-semibold text-yellow-600">
                {latePersons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Half Day</span>
              <span className="font-semibold text-orange-600">
                {halfDayPersons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Absent</span>
              <span className="font-semibold text-red-600">
                {absentPersons}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>On Leave</span>
              <span className="font-semibold text-blue-600">
                {onLeavePersons}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours & Time Card */}
      <Card>
        <CardHeader>
          <CardTitle>Time & Hours</CardTitle>
          <CardDescription>Work hours breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Hours Worked</span>
              <span className="font-semibold">{totalHours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Regular Hours</span>
              <span className="font-semibold">
                {totalRegularHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Overtime Hours</span>
              <span className="font-semibold text-orange-600">
                {totalOvertimeHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Overtime Pay</span>
              <span className="font-semibold text-green-600">
                R{totalOvertimePay.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Hours per Person</span>
              <span className="font-semibold">
                {averageHoursPerPerson.toFixed(1)}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Methods Card */}
      <Card>
        <CardHeader>
          <CardTitle>Check-In Methods</CardTitle>
          <CardDescription>Breakdown by check-in method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <span>GPS Check-In</span>
              </div>
              <span className="font-semibold">{gpsCheckIns}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </div>
                <span>Manual Check-In</span>
              </div>
              <span className="font-semibold">{manualCheckIns}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                  <QrCode className="h-4 w-4 text-green-600" />
                </div>
                <span>Barcode Check-In</span>
              </div>
              <span className="font-semibold">{barcodeCheckIns}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
          <CardDescription>Special cases and exceptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                  <Moon className="h-4 w-4 text-purple-600" />
                </div>
                <span>Night Shifts</span>
              </div>
              <span className="font-semibold">{nightShifts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <span>Bypass Applied</span>
              </div>
              <span className="font-semibold">{bypassApplied}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <div className="text-xs font-semibold text-blue-600">E</div>
                </div>
                <span>Employees with OT</span>
              </div>
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) =>
                      r.employeeId &&
                      safeDecimalToNumber(r.overtimeHours || 0) > 0,
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                  <div className="text-xs font-semibold text-orange-600">F</div>
                </div>
                <span>Freelancers with OT</span>
              </div>
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) =>
                      r.freeLancerId &&
                      safeDecimalToNumber(r.overtimeHours || 0) > 0,
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                  <div className="text-xs font-semibold text-orange-600">T</div>
                </div>
                <span>Trainers with OT</span>
              </div>
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) =>
                      r.trainerId &&
                      safeDecimalToNumber(r.overtimeHours || 0) > 0,
                  ).length
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution Card */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>
            Visual breakdown of attendance statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
              <span className="text-2xl font-bold text-green-600">
                {presentPersons}
              </span>
              <span className="text-sm text-green-700">Present</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
              <span className="text-2xl font-bold text-yellow-600">
                {latePersons}
              </span>
              <span className="text-sm text-yellow-700">Late</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
              <span className="text-2xl font-bold text-orange-600">
                {halfDayPersons}
              </span>
              <span className="text-sm text-orange-700">Half Day</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
              <span className="text-2xl font-bold text-red-600">
                {absentPersons}
              </span>
              <span className="text-sm text-red-700">Absent</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
              <span className="text-2xl font-bold text-blue-600">
                {onLeavePersons}
              </span>
              <span className="text-sm text-blue-700">On Leave</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl font-bold text-purple-600">
                {nightShifts}
              </span>
              <span className="text-sm text-purple-700">Night Shifts</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
              <span className="text-2xl font-bold text-green-700">
                {bypassApplied}
              </span>
              <span className="text-sm text-green-800">Bypass Rules</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg">
              <span className="text-2xl font-bold text-indigo-600">
                {attendanceRate.toFixed(0)}%
              </span>
              <span className="text-sm text-indigo-700">Attendance Rate</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
