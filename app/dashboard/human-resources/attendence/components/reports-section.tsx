import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, UserCheck, QrCode } from "lucide-react";
import {
  AttendanceRecord,
  AttendanceStatus,
  CheckInMethod,
} from "@prisma/client";
import { safeDecimalToNumber, isLeaveStatus } from "../utils";

interface ReportsSectionProps {
  attendanceRecords: AttendanceRecord[];
}

export function ReportsSection({ attendanceRecords }: ReportsSectionProps) {
  const totalEmployees = attendanceRecords.length;
  const presentEmployees = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.PRESENT
  ).length;
  const lateEmployees = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.LATE
  ).length;
  const absentEmployees = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.ABSENT
  ).length;
  const onLeaveEmployees = attendanceRecords.filter((r) =>
    isLeaveStatus(r.status)
  ).length;

  const totalHours = attendanceRecords.reduce(
    (sum, r) =>
      sum +
      safeDecimalToNumber(r.regularHours) +
      safeDecimalToNumber(r.overtimeHours),
    0
  );

  const totalOvertimeHours = attendanceRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.overtimeHours),
    0
  );

  const totalRegularHours = attendanceRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.regularHours),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>Daily attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Present</span>
              <span className="font-semibold text-green-600">
                {presentEmployees} (
                {totalEmployees > 0
                  ? Math.round((presentEmployees / totalEmployees) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Late</span>
              <span className="font-semibold text-yellow-600">
                {lateEmployees} (
                {totalEmployees > 0
                  ? Math.round((lateEmployees / totalEmployees) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Absent</span>
              <span className="font-semibold text-red-600">
                {absentEmployees} (
                {totalEmployees > 0
                  ? Math.round((absentEmployees / totalEmployees) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>On Leave</span>
              <span className="font-semibold text-blue-600">
                {onLeaveEmployees} (
                {totalEmployees > 0
                  ? Math.round((onLeaveEmployees / totalEmployees) * 100)
                  : 0}
                %)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hours Summary</CardTitle>
          <CardDescription>Time tracking overview</CardDescription>
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
              <span>Average Hours per Employee</span>
              <span className="font-semibold">
                {totalEmployees > 0
                  ? (totalHours / totalEmployees).toFixed(1)
                  : 0}
                h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) => r.checkInMethod === CheckInMethod.GPS
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </div>
                <span>Manual Check-In</span>
              </div>
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) => r.checkInMethod === CheckInMethod.MANUAL
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                  <QrCode className="h-4 w-4 text-green-600" />
                </div>
                <span>Barcode Check-In</span>
              </div>
              <span className="font-semibold">
                {
                  attendanceRecords.filter(
                    (r) => r.checkInMethod === CheckInMethod.BARCODE
                  ).length
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
