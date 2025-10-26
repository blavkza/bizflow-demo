import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveRequest } from "../types";

interface LeaveCalendarTabProps {
  leaveRequests: LeaveRequest[];
}

export default function LeaveCalendarTab({
  leaveRequests,
}: LeaveCalendarTabProps) {
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Filter approved leave requests for current month
  const currentMonthLeaves = leaveRequests.filter((request) => {
    if (request.status !== "APPROVED") return false;

    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    return (
      (startDate.getMonth() === currentMonth &&
        startDate.getFullYear() === currentYear) ||
      (endDate.getMonth() === currentMonth &&
        endDate.getFullYear() === currentYear) ||
      (startDate <= firstDayOfMonth && endDate >= lastDayOfMonth)
    );
  });

  // Function to get leaves for a specific day
  const getLeavesForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return currentMonthLeaves.filter((request) => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Leave Calendar -{" "}
          {firstDayOfMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </CardTitle>
        <CardDescription>
          View all approved leaves on the calendar. Green indicates leave days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold p-2 text-sm">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border rounded-lg p-2 bg-muted/20"
                />
              );
            }

            const leavesForDay = getLeavesForDay(day);
            const isLeaveDay = leavesForDay.length > 0;

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 hover:bg-muted cursor-pointer transition-colors ${
                  isLeaveDay ? "bg-green-50 border-green-200" : ""
                }`}
              >
                <div className="text-sm font-medium mb-1">{day}</div>
                <div className="space-y-1">
                  {leavesForDay.slice(0, 2).map((leave, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs bg-green-100 text-green-800 border-green-200 truncate w-full"
                    >
                      {leave.employeeName.split(" ")[0][0]}.{" "}
                      {leave.employeeName.split(" ")[1]}
                    </Badge>
                  ))}
                  {leavesForDay.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{leavesForDay.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 border rounded-lg bg-muted/20">
          <h4 className="font-medium mb-2">Legend</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Leave Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
              <span>Working Day</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
