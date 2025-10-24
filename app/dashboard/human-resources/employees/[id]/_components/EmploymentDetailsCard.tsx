"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeWithDetails } from "@/types/employee";
import { Clock, Calendar } from "lucide-react";

export function EmploymentDetailsCard({
  employee,
}: {
  employee: EmployeeWithDetails;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format time from string or Date
  const formatTime = (time: string | Date | null | undefined): string => {
    if (!time) return "Not set";

    try {
      if (typeof time === "string") {
        // If it's already in HH:mm format
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
          const [hours, minutes] = time.split(":");
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes));
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }

        // If it's an ISO string or other date format
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      }

      if (time instanceof Date) {
        return time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }

      return "Not set";
    } catch {
      return "Not set";
    }
  };

  // Helper function to get day name from abbreviation
  const getDayName = (abbreviation: string): string => {
    const dayMap: { [key: string]: string } = {
      MON: "Monday",
      TUE: "Tuesday",
      WED: "Wednesday",
      THU: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
      SUN: "Sunday",
    };
    return dayMap[abbreviation] || abbreviation;
  };

  // Parse working days from string or array
  const getWorkingDays = (): string[] => {
    if (!employee.workingDays) return [];

    try {
      if (Array.isArray(employee.workingDays)) {
        return employee.workingDays;
      }

      if (typeof employee.workingDays === "string") {
        return JSON.parse(employee.workingDays);
      }

      return [];
    } catch {
      return [];
    }
  };

  const workingDays = getWorkingDays();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manager */}
        <div>
          <p className="text-sm font-medium">Manager</p>
          <p className="text-sm text-muted-foreground">
            {employee.department?.manager?.name || "Not assigned"}
          </p>
        </div>

        {/* Start Date */}
        <div>
          <p className="text-sm font-medium">Start Date</p>
          <p className="text-sm text-muted-foreground">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>

        {/* Working Hours */}
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Working Hours
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Knock In</p>
              <p className="font-medium text-green-700">
                {formatTime(employee.scheduledKnockIn)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Knock Out</p>
              <p className="font-medium text-red-500">
                {formatTime(employee.scheduledKnockOut)}
              </p>
            </div>
          </div>
        </div>

        {/* Working Days */}
        {workingDays.length > 0 && (
          <div>
            <p className="text-sm font-medium flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" />
              Working Days
            </p>
            <div className="flex flex-wrap gap-2">
              {workingDays.map((day) => (
                <Badge
                  key={day}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {getDayName(day)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {workingDays.length === 0 && (
          <div>
            <p className="text-sm font-medium">Working Days</p>
            <p className="text-sm text-muted-foreground">Not set</p>
          </div>
        )}

        {/* Status */}
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge className={getStatusColor(employee.status)}>
            {employee.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Work Type / Position */}
        <div>
          <p className="text-sm font-medium">Position</p>
          <p className="text-sm text-muted-foreground">
            {employee.position || "Not specified"}
          </p>
        </div>

        {/* Department */}
        <div>
          <p className="text-sm font-medium">Department</p>
          <p className="text-sm text-muted-foreground">
            {employee.department?.name || "Not assigned"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
