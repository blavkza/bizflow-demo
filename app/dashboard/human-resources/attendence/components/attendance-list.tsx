import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MapPin, Clock, Calendar } from "lucide-react";
import { AttendanceRecord } from "../types";
import {
  getStatusColor,
  getStatusDisplayName,
  getCheckInMethodColor,
  decimalToNumber,
  formatTime,
  safeDecimalToNumber,
} from "../utils";
import { StatusIcon, CheckInMethodIcon } from "../icons";
import { useRouter } from "next/navigation";

interface AttendanceListProps {
  records: AttendanceRecord[];
  loading: boolean;
  onClearFilters: () => void;
}

export function AttendanceList({
  records,
  loading,
  onClearFilters,
}: AttendanceListProps) {
  const router = useRouter();

  // Helper function to determine if employee should show as "Not Checked In" instead of "Absent"
  const shouldShowNotCheckedIn = (record: AttendanceRecord) => {
    // If employee has checked in, show actual status
    if (record.checkIn) return false;

    // If it's a leave status, show leave status
    if (
      record.status === "ANNUAL_LEAVE" ||
      record.status === "SICK_LEAVE" ||
      record.status === "UNPAID_LEAVE"
    ) {
      return false;
    }

    // If it's not a working day, show as absent
    if (record.displayStatus === "Day Off") return false;

    const now = new Date();
    const scheduledKnockIn = record.employee.scheduledKnockIn;

    // If no schedule is set, show as absent
    if (!scheduledKnockIn) return false;

    // Create today's scheduled time
    const scheduledTime = new Date(scheduledKnockIn);
    const todayScheduled = new Date();
    todayScheduled.setHours(
      scheduledTime.getHours(),
      scheduledTime.getMinutes(),
      0,
      0
    );

    // If current time is before scheduled knock-in time + grace period (15 minutes), show as "Not Checked In"
    const gracePeriod = new Date(todayScheduled.getTime() + 15 * 60000); // 15 minutes grace period

    return now <= gracePeriod;
  };

  // Helper function to get display status text
  const getDisplayStatusText = (record: AttendanceRecord) => {
    if (shouldShowNotCheckedIn(record)) {
      const scheduledKnockIn = record.employee.scheduledKnockIn;
      if (scheduledKnockIn) {
        const scheduledTime = new Date(scheduledKnockIn);
        const todayScheduled = new Date();
        todayScheduled.setHours(
          scheduledTime.getHours(),
          scheduledTime.getMinutes(),
          0,
          0
        );

        const now = new Date();
        if (now < todayScheduled) {
          return "Not Checked In";
        } else {
          return "Not Checked In - Late";
        }
      }
      return "Not Checked In";
    }

    return record.displayStatus || getStatusDisplayName(record.status);
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (record: AttendanceRecord) => {
    if (shouldShowNotCheckedIn(record)) {
      const scheduledKnockIn = record.employee.scheduledKnockIn;
      if (scheduledKnockIn) {
        const scheduledTime = new Date(scheduledKnockIn);
        const todayScheduled = new Date();
        todayScheduled.setHours(
          scheduledTime.getHours(),
          scheduledTime.getMinutes(),
          0,
          0
        );

        const now = new Date();
        if (now >= todayScheduled) {
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        }
      }
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }

    return getStatusColor(record.status, record.displayStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading attendance records...
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No attendance records found
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            No attendance records match your current filters. Try adjusting your
            search criteria.
          </p>
          <Button onClick={onClearFilters}>Clear Filters</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const employeeName = `${record.employee.firstName} ${record.employee.lastName}`;
        const regularHours = safeDecimalToNumber(record.regularHours);
        const overtimeHours = safeDecimalToNumber(record.overtimeHours);
        const totalHours = regularHours + overtimeHours;

        // Check if this is a virtual record (no actual check-in)
        const isVirtualRecord = record.isVirtualRecord || !record.checkIn;
        const hasCheckedOut = !!record.checkOut;

        // Get scheduled times from employee record
        const scheduledKnockIn = record.employee.scheduledKnockIn;
        const scheduledKnockOut = record.employee.scheduledKnockOut;

        const showNotCheckedIn = shouldShowNotCheckedIn(record);
        const displayStatusText = getDisplayStatusText(record);
        const statusBadgeColor = getStatusBadgeColor(record);

        return (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div
                  onClick={() =>
                    router.push(
                      `/dashboard/human-resources/employees/${record.employeeId}`
                    )
                  }
                  className="flex items-center space-x-4 cursor-pointer"
                >
                  <Avatar>
                    <AvatarImage
                      src={record.employee.avatar || "/placeholder.svg"}
                      alt={employeeName}
                    />
                    <AvatarFallback>
                      {employeeName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{employeeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {record.employee.employeeNumber} •{" "}
                      {record.employee.position}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.employee.department?.name}
                    </p>

                    {/* Show scheduled times from employee record */}
                    {scheduledKnockIn && scheduledKnockOut && (
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Scheduled: {formatTime(scheduledKnockIn)} -{" "}
                          {formatTime(scheduledKnockOut)}
                        </div>

                        {/* Show time until scheduled check-in */}
                        {showNotCheckedIn && !record.checkIn && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Clock className="h-3 w-3" />
                            {(() => {
                              const scheduledTime = new Date(scheduledKnockIn);
                              const todayScheduled = new Date();
                              todayScheduled.setHours(
                                scheduledTime.getHours(),
                                scheduledTime.getMinutes(),
                                0,
                                0
                              );
                              const now = new Date();

                              if (now < todayScheduled) {
                                const diffMs =
                                  todayScheduled.getTime() - now.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                if (diffMins > 60) {
                                  const diffHours = Math.floor(diffMins / 60);
                                  return `Check-in in ${diffHours}h ${diffMins % 60}m`;
                                }
                                return `Check-in in ${diffMins}m`;
                              } else {
                                const diffMs =
                                  now.getTime() - todayScheduled.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                if (diffMins > 60) {
                                  const diffHours = Math.floor(diffMins / 60);
                                  return `${diffHours}h ${diffMins % 60}m overdue`;
                                }
                                return `${diffMins}m overdue`;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show if no schedule is set */}
                    {(!scheduledKnockIn || !scheduledKnockOut) && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        No schedule set
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <Badge className={statusBadgeColor}>
                    <StatusIcon status={record.status} />
                    <span className="ml-1">{displayStatusText}</span>
                  </Badge>

                  {/* Check-In Method - Only show if actually checked in */}
                  {record.checkInMethod && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Method
                      </p>
                      <Badge
                        variant="outline"
                        className={getCheckInMethodColor(record.checkInMethod)}
                      >
                        <CheckInMethodIcon method={record.checkInMethod} />
                        <span className="ml-1">{record.checkInMethod}</span>
                      </Badge>
                    </div>
                  )}

                  {/* Check In */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="font-medium">
                      {record.checkIn ? (
                        formatTime(record.checkIn)
                      ) : (
                        <span className="text-orange-500">-</span>
                      )}
                    </p>
                    {!record.checkIn && showNotCheckedIn && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expected by{" "}
                        {scheduledKnockIn
                          ? formatTime(scheduledKnockIn)
                          : "schedule"}
                      </p>
                    )}
                  </div>

                  {/* Check Out */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="font-medium">
                      {record.checkOut ? (
                        formatTime(record.checkOut)
                      ) : (
                        <span className="text-orange-500">-</span>
                      )}
                    </p>
                    {record.checkIn && !record.checkOut && (
                      <p className="text-xs text-green-600 mt-1">
                        Still checked in
                      </p>
                    )}
                  </div>

                  {/* Total Hours - Only show if checked in */}
                  {record.checkIn && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Total Hours
                      </p>
                      <p className="font-semibold">{totalHours.toFixed(1)}h</p>
                    </div>
                  )}

                  {/* Overtime - Only show if checked in and has overtime */}
                  {record.checkIn && overtimeHours > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Overtime</p>
                      <p className="font-medium text-orange-600">
                        {overtimeHours.toFixed(1)}h
                      </p>
                    </div>
                  )}

                  {/* Location - Only show if checked in */}
                  {record.checkIn && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {record.checkInAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details - Only show if checked in */}
              {record.checkIn && (record.notes || record.checkInLat) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {record.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                    {record.checkInLat && record.checkInLng && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          GPS Coordinates
                        </p>
                        <p className="text-sm font-mono">
                          {safeDecimalToNumber(record.checkInLat).toFixed(4)},{" "}
                          {safeDecimalToNumber(record.checkInLng).toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message for virtual records */}
              {isVirtualRecord && !record.checkIn && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {record.status === "ANNUAL_LEAVE" ||
                      record.status === "SICK_LEAVE" ||
                      record.status === "UNPAID_LEAVE"
                        ? `Employee is on ${getStatusDisplayName(record.status).toLowerCase()}`
                        : showNotCheckedIn
                          ? "Employee has not checked in yet"
                          : scheduledKnockIn && scheduledKnockOut
                            ? `Expected schedule: ${formatTime(scheduledKnockIn)} - ${formatTime(scheduledKnockOut)}`
                            : "No schedule set for employee"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
