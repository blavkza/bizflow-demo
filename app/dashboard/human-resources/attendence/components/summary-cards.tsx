import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceStatus } from "@prisma/client";
import { AttendanceRecord } from "../types"; // Import from your local types
import { safeDecimalToNumber, isLeaveStatus, getDisplayStatus } from "../utils";

interface SummaryCardsProps {
  attendanceRecords: AttendanceRecord[];
}

// Helper function to check if person should be counted as "Not Checked In"
function isNotCheckedIn(record: AttendanceRecord): boolean {
  const displayStatus = getDisplayStatus(record);
  return (
    !record.checkIn &&
    (displayStatus === "Not Checked In" ||
      displayStatus === "Not Checked In - Late")
  );
}

// Helper function to check if person should be counted as "Absent"
function isActuallyAbsent(record: AttendanceRecord): boolean {
  const displayStatus = getDisplayStatus(record);
  return (
    record.status === AttendanceStatus.ABSENT && displayStatus === "Absent"
  );
}

export function SummaryCards({ attendanceRecords }: SummaryCardsProps) {
  const totalEmployees = attendanceRecords.filter(
    (record) => record.employeeId,
  ).length;
  const totalTrainees = attendanceRecords.filter(
    (record) => record.freeLancerId || record.traineeId,
  ).length;
  const totalPersons = attendanceRecords.length;

  // Count actually checked in present persons
  const presentPersons = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.PRESENT && r.checkIn !== null,
  ).length;

  // Count actually checked in late persons
  const latePersons = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.LATE && r.checkIn !== null,
  ).length;

  // Count persons who haven't checked in yet
  const notCheckedInPersons = attendanceRecords.filter((r) =>
    isNotCheckedIn(r),
  ).length;

  // Count actual absent persons (excluding "not checked in" ones)
  const absentPersons = attendanceRecords.filter((r) =>
    isActuallyAbsent(r),
  ).length;

  const onLeavePersons = attendanceRecords.filter((r) =>
    isLeaveStatus(r.status),
  ).length;

  // Only calculate hours for persons who have checked in
  const checkedInRecords = attendanceRecords.filter((r) => r.checkIn !== null);

  const totalHours = checkedInRecords.reduce(
    (sum, r) =>
      sum +
      safeDecimalToNumber(r.regularHours) +
      safeDecimalToNumber(r.overtimeHours),
    0,
  );

  const totalOvertimeHours = checkedInRecords.reduce(
    (sum, r) => sum + safeDecimalToNumber(r.overtimeHours),
    0,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium"> Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">Active employees</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trainees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrainees}</div>
          <p className="text-xs text-muted-foreground">Active trainees</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPersons}</div>
          <p className="text-xs text-muted-foreground">All persons today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {presentPersons}
          </div>
          <p className="text-xs text-muted-foreground">Checked in on time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {latePersons}
          </div>
          <p className="text-xs text-muted-foreground">Checked in late</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{absentPersons}</div>
          <p className="text-xs text-muted-foreground">Unexcused absence</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {onLeavePersons}
          </div>
          <p className="text-xs text-muted-foreground">Approved leave</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">Worked today</p>
        </CardContent>
      </Card>
    </div>
  );
}

