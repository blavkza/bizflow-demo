import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { AttendanceRecord, AttendanceStatus } from "@prisma/client";
import { safeDecimalToNumber, isLeaveStatus, getDisplayStatus } from "../utils";

interface SummaryCardsProps {
  attendanceRecords: AttendanceRecord[];
}

// Helper function to check if employee should be counted as "Not Checked In"
function isNotCheckedIn(record: AttendanceRecord): boolean {
  const displayStatus = getDisplayStatus(record);
  return (
    !record.checkIn &&
    (displayStatus === "Not Checked In" ||
      displayStatus === "Not Checked In - Late")
  );
}

// Helper function to check if employee should be counted as "Absent"
function isActuallyAbsent(record: AttendanceRecord): boolean {
  const displayStatus = getDisplayStatus(record);
  return (
    record.status === AttendanceStatus.ABSENT && displayStatus === "Absent"
  );
}

export function SummaryCards({ attendanceRecords }: SummaryCardsProps) {
  const totalEmployees = attendanceRecords.length;

  // Count actually checked in present employees
  const presentEmployees = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.PRESENT && r.checkIn !== null
  ).length;

  // Count actually checked in late employees
  const lateEmployees = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.LATE && r.checkIn !== null
  ).length;

  // Count employees who haven't checked in yet
  const notCheckedInEmployees = attendanceRecords.filter((r) =>
    isNotCheckedIn(r)
  ).length;

  // Count actual absent employees (excluding "not checked in" ones)
  const absentEmployees = attendanceRecords.filter((r) =>
    isActuallyAbsent(r)
  ).length;

  const onLeaveEmployees = attendanceRecords.filter((r) =>
    isLeaveStatus(r.status)
  ).length;

  // Only calculate hours for employees who have checked in
  const checkedInRecords = attendanceRecords.filter((r) => r.checkIn !== null);

  const totalHours = checkedInRecords.reduce(
    (sum, r) =>
      sum +
      safeDecimalToNumber(r.regularHours) +
      safeDecimalToNumber(r.overtimeHours),
    0
  );

  const totalOvertimeHours = checkedInRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.overtimeHours),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">Tracked today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {presentEmployees}
          </div>
          <p className="text-xs text-muted-foreground">Checked in on time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {lateEmployees}
          </div>
          <p className="text-xs text-muted-foreground">Checked in late</p>
        </CardContent>
      </Card>
      {/*  <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Not Checked In</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">
            {notCheckedInEmployees}
          </div>
          <p className="text-xs text-muted-foreground">Pending check-in</p>
        </CardContent>
      </Card> */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {absentEmployees}
          </div>
          <p className="text-xs text-muted-foreground">Unexcused absence</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {onLeaveEmployees}
          </div>
          <p className="text-xs text-muted-foreground">Approved leave</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">Worked today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overtime</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {totalOvertimeHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">Extra hours</p>
        </CardContent>
      </Card>
    </div>
  );
}
