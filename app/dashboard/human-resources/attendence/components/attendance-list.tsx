import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Users, MapPin, Clock, Calendar, UserCog } from "lucide-react";
import { AttendanceRecord } from "../types";
import {
  getStatusColor,
  getStatusDisplayName,
  getCheckInMethodColor,
  formatTime,
  safeDecimalToNumber,
} from "../utils";
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

  const isValidScheduledTime = (time: string | null | undefined): boolean => {
    if (!time) return false;
    if (typeof time !== "string") return false;
    if (time.trim() === "") return false;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time.trim());
  };

  const shouldShowNotCheckedIn = (record: AttendanceRecord) => {
    if (record.checkIn) return false;

    if (
      record.status === "ANNUAL_LEAVE" ||
      record.status === "SICK_LEAVE" ||
      record.status === "UNPAID_LEAVE"
    ) {
      return false;
    }

    if (record.displayStatus === "Day Off") return false;

    const now = new Date();
    const person = record.employee || record.freeLancer;
    const scheduledKnockIn = person?.scheduledKnockIn;

    if (!isValidScheduledTime(scheduledKnockIn)) return false;

    try {
      const scheduledTime = new Date(`1970-01-01T${scheduledKnockIn}`);
      const todayScheduled = new Date();
      todayScheduled.setHours(
        scheduledTime.getHours(),
        scheduledTime.getMinutes(),
        0,
        0
      );

      const gracePeriod = new Date(todayScheduled.getTime() + 30 * 60000); // 30 minutes grace period

      return now <= gracePeriod;
    } catch (error) {
      console.error("Error parsing scheduled time:", error);
      return false;
    }
  };

  const getDisplayStatusText = (record: AttendanceRecord) => {
    if (shouldShowNotCheckedIn(record)) {
      const person = record.employee || record.freeLancer;
      const scheduledKnockIn = person?.scheduledKnockIn;
      if (isValidScheduledTime(scheduledKnockIn)) {
        try {
          const scheduledTime = new Date(`1970-01-01T${scheduledKnockIn}`);
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
        } catch (error) {
          console.error("Error parsing scheduled time for status:", error);
        }
      }
      return "Not Checked In";
    }

    return record.displayStatus || getStatusDisplayName(record.status);
  };

  const getStatusBadgeColor = (record: AttendanceRecord) => {
    if (shouldShowNotCheckedIn(record)) {
      const person = record.employee || record.freeLancer;
      const scheduledKnockIn = person?.scheduledKnockIn;
      if (isValidScheduledTime(scheduledKnockIn)) {
        try {
          const scheduledTime = new Date(`1970-01-01T${scheduledKnockIn}`);
          const todayScheduled = new Date();
          todayScheduled.setHours(
            scheduledTime.getHours(),
            scheduledTime.getMinutes(),
            0,
            0
          );

          const now = new Date();
          if (now >= todayScheduled) {
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
          }
        } catch (error) {
          console.error("Error parsing scheduled time for badge color:", error);
        }
      }
      return "bg-gray-100 text-gray-800 border-gray-200";
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
        const person = record.employee || record.freeLancer;
        const personType = record.employee ? "employee" : "freelancer";
        const personId = record.employee
          ? record.employee.employeeNumber
          : record.freeLancer?.freeLancerNumber;

        if (!person) return null;

        const personName = `${person.firstName} ${person.lastName}`;
        const regularHours = safeDecimalToNumber(record.regularHours);
        const overtimeHours = safeDecimalToNumber(record.overtimeHours);

        // Check if this is a virtual record (no actual check-in)
        const isVirtualRecord = record.isVirtualRecord || !record.checkIn;

        // Get scheduled times from person record with validation
        const scheduledKnockIn = person.scheduledKnockIn;
        const scheduledKnockOut = person.scheduledKnockOut;
        const hasValidSchedule =
          isValidScheduledTime(scheduledKnockIn) &&
          isValidScheduledTime(scheduledKnockOut);

        const showNotCheckedIn = shouldShowNotCheckedIn(record);
        const displayStatusText = getDisplayStatusText(record);
        const statusBadgeColor = getStatusBadgeColor(record);

        return (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Left Side: Person Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <Avatar>
                    <AvatarImage
                      src={person.avatar || "/placeholder.svg"}
                      alt={personName}
                    />
                    <AvatarFallback>
                      {personName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{personName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {personType === "employee" ? (
                          <Users className="w-3 h-3 mr-1" />
                        ) : (
                          <UserCog className="w-3 h-3 mr-1" />
                        )}
                        {personType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personId} • {person.position}
                    </p>
                    {person.department && (
                      <p className="text-xs text-muted-foreground">
                        {person.department.name}
                      </p>
                    )}

                    {/* Show scheduled times for both employees and freelancers */}
                    {hasValidSchedule ? (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Scheduled: {formatTime(scheduledKnockIn!)} -{" "}
                          {formatTime(scheduledKnockOut!)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 text-xs text-orange-600">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {scheduledKnockIn || scheduledKnockOut
                            ? "Invalid schedule format"
                            : "No schedule set"}
                        </span>
                      </div>
                    )}

                    {/* Show time until scheduled check-in for not checked in persons */}
                    {showNotCheckedIn &&
                      !record.checkIn &&
                      isValidScheduledTime(scheduledKnockIn) && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                          <Clock className="h-3 w-3" />
                          <span>
                            {(() => {
                              try {
                                const scheduledTime = new Date(
                                  `1970-01-01T${scheduledKnockIn}`
                                );
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
                              } catch (error) {
                                console.error(
                                  "Error calculating time difference:",
                                  error
                                );
                                return "Schedule error";
                              }
                            })()}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Right Side: Status and Times */}
                <div className="flex items-center space-x-6">
                  {/* Status */}
                  <div className="text-center">
                    <Badge className={statusBadgeColor}>
                      {displayStatusText}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="font-medium text-sm">
                      {record.checkIn ? (
                        formatTime(record.checkIn)
                      ) : (
                        <span className="text-orange-500">-</span>
                      )}
                    </p>

                    {record.checkInAddress && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {record.checkInAddress}
                            </span>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto max-w-xs">
                          {record.checkInAddress}
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </div>
                  {/* Check Out */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="font-medium text-sm">
                      {record.checkOut ? (
                        formatTime(record.checkOut)
                      ) : (
                        <span className="text-orange-500">-</span>
                      )}
                    </p>
                  </div>
                  {/* Hours */}
                  {(record.regularHours || record.overtimeHours) && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">
                          {safeDecimalToNumber(
                            record.regularHours || 0
                          ).toFixed(1)}
                          h
                        </span>
                        {safeDecimalToNumber(record.overtimeHours || 0) > 0 && (
                          <span className="text-orange-600">
                            +
                            {safeDecimalToNumber(
                              record.overtimeHours || 0
                            ).toFixed(1)}
                            h OT
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Scheduled Time (if not checked in) */}
                  {!record.checkIn &&
                    isValidScheduledTime(scheduledKnockIn) && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Scheduled
                        </p>
                        <div className="flex items-center text-sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(scheduledKnockIn!)}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Additional Info Row */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {/* Check-in Method */}
                    {record.checkInMethod && (
                      <div className="flex items-center">
                        <span className="mr-1">Method:</span>
                        <Badge
                          variant="outline"
                          className={getCheckInMethodColor(
                            record.checkInMethod
                          )}
                        >
                          {record.checkInMethod}
                        </Badge>
                      </div>
                    )}

                    {/* GPS Coordinates */}
                    {record.checkInLat && record.checkInLng && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>
                          {safeDecimalToNumber(record.checkInLat).toFixed(4)},{" "}
                          {safeDecimalToNumber(record.checkInLng).toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                      <div className="flex items-center">
                        <span>Notes: {record.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Virtual Record Indicator */}
                  {isVirtualRecord && !record.checkIn && (
                    <div className="flex items-center text-orange-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {record.status === "ANNUAL_LEAVE" ||
                        record.status === "SICK_LEAVE" ||
                        record.status === "UNPAID_LEAVE"
                          ? `On ${getStatusDisplayName(record.status).toLowerCase()}`
                          : showNotCheckedIn
                            ? "Not checked in yet"
                            : "No schedule set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
