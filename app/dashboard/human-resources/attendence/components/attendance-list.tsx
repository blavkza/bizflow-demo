import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Users,
  MapPin,
  Clock,
  Calendar,
  UserCog,
  Zap,
  Moon,
  AlertCircle,
} from "lucide-react";
import { AttendanceRecord } from "../types";
import {
  getStatusColor,
  getStatusDisplayName,
  getCheckInMethodColor,
  formatTime,
  safeDecimalToNumber,
  getDisplayStatus,
  isLeaveStatus,
} from "../utils";
import { useRouter } from "next/navigation";

interface AttendanceListProps {
  records: AttendanceRecord[];
  loading: boolean;
  bypassRules?: any[]; // NEW PROP
  onClearFilters: () => void;
}

export function AttendanceList({
  records,
  loading,
  bypassRules = [], // NEW DEFAULT
  onClearFilters,
}: AttendanceListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    
    // Optional: update now every minute if needed for live overdue timers
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isValidScheduledTime = (time: string | null | undefined): boolean => {
    if (!time) return false;
    if (typeof time !== "string") return false;
    if (time.trim() === "") return false;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time.trim());
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const isNightShift = (record: AttendanceRecord): boolean => {
    if (!record.checkIn || !record.checkOut) return false;
    const checkInDate = new Date(record.checkIn);
    const checkOutDate = new Date(record.checkOut);
    return checkInDate.getDate() !== checkOutDate.getDate();
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateOvertimePay = (record: AttendanceRecord): number | null => {
    if (
      !record.overtimeHours ||
      safeDecimalToNumber(record.overtimeHours) <= 0
    ) {
      return null;
    }
    const overtimeHours = safeDecimalToNumber(record.overtimeHours);
    const person = record.employee || record.freeLancer;

    if (!person) return null;

    // Get overtimeHourRate from employee/freelancer profile
    const overtimeHourRate = person.overtimeHourRate;

    // If overtimeHourRate is not set, return null
    if (!overtimeHourRate || safeDecimalToNumber(overtimeHourRate) <= 0) {
      return null;
    }

    const rate = safeDecimalToNumber(overtimeHourRate);
    return overtimeHours * rate;
  };

  const hasBypass = (record: AttendanceRecord): boolean => {
    if (record.bypassApplied) return true;
    if (
      record.notes?.toLowerCase().includes("bypass") ||
      record.notes?.toLowerCase().includes("custom time") ||
      record.notes?.toLowerCase().includes("restrictions bypassed")
    ) {
      return true;
    }
    return false;
  };

  const extractCustomTimes = (record: AttendanceRecord) => {
    const customTimes = {
      checkIn: null as string | null,
      checkOut: null as string | null,
    };

    if (record.notes) {
      const checkInMatch = record.notes.match(
        /(?:custom|bypass|schedule changed).*?(?:check.in|time|to).*?(\d{1,2}:\d{2})/i
      );
      const checkOutMatch = record.notes.match(
        /(?:custom|bypass).*?(?:check.out|time).*?(\d{1,2}:\d{2})/i
      );

      if (checkInMatch) customTimes.checkIn = checkInMatch[1];
      if (checkOutMatch) customTimes.checkOut = checkOutMatch[1];
    }
    return customTimes;
  };

  // ----------------------------------------------------------------------
  // SMART SCHEDULE RETRIEVAL
  // Priority: Custom Notes > Record Snapshot > Active Bypass Rule > Profile Default
  // ----------------------------------------------------------------------
  const getScheduledTimes = (
    person: any,
    date: Date,
    record?: AttendanceRecord,
    customTimes?: { checkIn: string | null; checkOut: string | null }
  ) => {
    const weekend = isWeekend(date);
    let knockIn = null;
    let knockOut = null;
    let isBypassSchedule = false;
    let bypassSource: "rule" | "record" | "notes" | null = null;
    let bypassCheckOutSpecified = false;

    // 1. Start with Profile Defaults
    if (weekend) {
      knockIn =
        person.scheduledWeekendKnockIn ?? person.scheduledKnockIn ?? null;
      knockOut =
        person.scheduledWeekendKnockOut ?? person.scheduledKnockOut ?? null;
    } else {
      knockIn = person.scheduledKnockIn ?? null;
      knockOut = person.scheduledKnockOut ?? null;
    }

    // 2. Check for Active Bypass Rules (Pre-CheckIn Override)
    // This handles the case where user hasn't checked in yet
    if (bypassRules && bypassRules.length > 0 && person.id) {
      const activeRule = bypassRules.find((rule: any) => {
        // Date Check
        const ruleStart = new Date(rule.startDate);
        const ruleEnd = new Date(rule.endDate);
        ruleStart.setHours(0, 0, 0, 0);
        ruleEnd.setHours(23, 59, 59, 999);
        const recordDate = new Date(date);
        recordDate.setHours(12, 0, 0, 0); // Middle of day to avoid edge cases

        const isDateInRange = recordDate >= ruleStart && recordDate <= ruleEnd;

        // Person Check
        const hasEmployee = rule.employees?.some(
          (e: any) => e.id === person.id
        );
        const hasFreelancer = rule.freelancers?.some(
          (f: any) => f.id === person.id
        );

        return isDateInRange && (hasEmployee || hasFreelancer);
      });

      if (activeRule) {
        if (
          activeRule.customCheckInTime &&
          activeRule.customCheckInTime !== "none"
        ) {
          knockIn = activeRule.customCheckInTime;
          isBypassSchedule = true;
          bypassSource = "rule";

          // Check if checkout time is specified in bypass rule
          bypassCheckOutSpecified = !!(
            activeRule.customCheckOutTime &&
            activeRule.customCheckOutTime !== "none"
          );
        }
        if (
          activeRule.customCheckOutTime &&
          activeRule.customCheckOutTime !== "none"
        ) {
          knockOut = activeRule.customCheckOutTime;
          isBypassSchedule = true;
          bypassSource = "rule";
          bypassCheckOutSpecified = true;
        }
      }
    }

    // 3. Override with Record Snapshot (Backend Snapshot)
    // If we have a record, trust what the backend saved, as it might have specific logic
    if (record?.scheduledKnockIn) {
      knockIn = record.scheduledKnockIn;
      if (record.bypassApplied) {
        isBypassSchedule = true;
        bypassSource = "record";

        // Check if checkout time was recorded as bypass
        if (
          record.scheduledKnockOut &&
          record.notes?.toLowerCase().includes("bypass")
        ) {
          bypassCheckOutSpecified = true;
        }
      }
    }
    if (record?.scheduledKnockOut) {
      knockOut = record.scheduledKnockOut;
      if (record.bypassApplied) {
        isBypassSchedule = true;
        bypassSource = "record";
        bypassCheckOutSpecified = true;
      }
    }

    // 4. Override with Explicit Custom Times from Notes (Highest Priority)
    if (customTimes?.checkIn) {
      knockIn = customTimes.checkIn;
      isBypassSchedule = true;
      bypassSource = "notes";
      bypassCheckOutSpecified = !!customTimes.checkOut;
    }
    if (customTimes?.checkOut) {
      knockOut = customTimes.checkOut;
      isBypassSchedule = true;
      bypassSource = "notes";
      bypassCheckOutSpecified = true;
    }

    return {
      knockIn,
      knockOut,
      isWeekend: weekend,
      isBypassSchedule,
      bypassSource,
      bypassCheckOutSpecified,
    };
  };

  const shouldShowNotCheckedIn = (record: AttendanceRecord) => {
    if (!mounted || !now) return false;
    if (record.checkIn) return false;
    if (isLeaveStatus(record.status)) return false;
    if (record.displayStatus === "Day Off") return false;

    const person = record.employee || record.freeLancer;
    const recordDate = new Date(record.date);

    // Check if it's today
    const isToday = now.toDateString() === recordDate.toDateString();
    if (!isToday) return false;

    const { knockIn: scheduledKnockIn } = getScheduledTimes(
      person,
      recordDate,
      record,
      extractCustomTimes(record)
    );

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
      const gracePeriod = new Date(todayScheduled.getTime() + 30 * 60000);
      return now <= gracePeriod;
    } catch (error) {
      return false;
    }
  };

  const getDisplayStatusText = (record: AttendanceRecord) => {
    if (shouldShowNotCheckedIn(record)) {
      const person = record.employee || record.freeLancer;
      const recordDate = new Date(record.date);
      const { knockIn: scheduledKnockIn } = getScheduledTimes(
        person,
        recordDate,
        record,
        extractCustomTimes(record)
      );

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
          if (!now) return "Not Checked In";
          if (now < todayScheduled) return "Not Checked In";
          else return "Not Checked In - Late";
        } catch (error) {}
      }
      return "Not Checked In";
    }

    // Use getDisplayStatus from utils
    return getDisplayStatus(record);
  };

  const getStatusBadgeColor = (record: AttendanceRecord) => {
    const displayStatus = getDisplayStatusText(record);

    if (displayStatus.includes("Not Checked In")) {
      if (displayStatus.includes("Late")) {
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      }
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    return getStatusColor(record.status, displayStatus);
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
            No attendance records match your current filters.
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

        const personName = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unknown";
        const regularHours = safeDecimalToNumber(record.regularHours);
        const overtimeHours = safeDecimalToNumber(record.overtimeHours);
        const overtimePay = calculateOvertimePay(record);
        const nightShift = isNightShift(record);
        const bypassApplied = hasBypass(record);
        const customTimes = extractCustomTimes(record);
        const hasCustomTime = customTimes.checkIn || customTimes.checkOut;
        const isVirtualRecord = record.isVirtualRecord || !record.checkIn;

        const recordDate = new Date(record.date);
        const {
          knockIn: scheduledKnockIn,
          knockOut: scheduledKnockOut,
          isWeekend,
          isBypassSchedule,
          bypassSource,
          bypassCheckOutSpecified,
        } = getScheduledTimes(person, recordDate, record, customTimes);

        const hasValidSchedule =
          isValidScheduledTime(scheduledKnockIn) &&
          isValidScheduledTime(scheduledKnockOut);

        const showNotCheckedIn = shouldShowNotCheckedIn(record);
        const displayStatusText = getDisplayStatusText(record);
        const statusBadgeColor = getStatusBadgeColor(record);

        // Format schedule display text
        const getScheduleDisplayText = () => {
          if (!isValidScheduledTime(scheduledKnockIn)) {
            return "No schedule set";
          }

          let displayText = "";

          if (isBypassSchedule) {
            displayText = "Bypass Schedule: ";
          } else {
            displayText = "Scheduled: ";
          }

          displayText += formatTime(scheduledKnockIn!);

          if (isValidScheduledTime(scheduledKnockOut)) {
            displayText += ` - ${formatTime(scheduledKnockOut!)}`;

            // Add warning if bypass schedule doesn't specify checkout time
            if (isBypassSchedule && !bypassCheckOutSpecified) {
              displayText += " (using default checkout)";
            }
          } else if (isBypassSchedule) {
            displayText += " - Not specified";
          } else {
            displayText += " - Not set";
          }

          if (isWeekend && !isBypassSchedule) {
            displayText += " (Weekend)";
          }

          return displayText;
        };

        return (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Left Side */}
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
                      {isWeekend && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Weekend
                        </Badge>
                      )}
                      {nightShift && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          <Moon className="w-3 h-3 mr-1" />
                          Night Shift
                        </Badge>
                      )}
                      {bypassApplied && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          Bypass Applied
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {personId} • {person.position}
                    </p>
                    {person.department && (
                      <p className="text-xs text-muted-foreground">
                        {person.department.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Record Date: {formatDate(record.date)}
                        {nightShift && record.checkIn && record.checkOut && (
                          <span className="ml-2">
                            ({formatDate(record.checkIn)} →{" "}
                            {formatDate(record.checkOut)})
                          </span>
                        )}
                      </span>
                    </div>

                    {isValidScheduledTime(scheduledKnockIn) ? (
                      <div className="flex items-center gap-2 mt-1">
                        {isBypassSchedule ? (
                          <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span
                            className={`text-xs ${
                              isBypassSchedule
                                ? bypassCheckOutSpecified
                                  ? "font-medium text-amber-700"
                                  : "font-medium text-amber-700"
                                : "text-muted-foreground"
                            }`}
                          >
                            {getScheduleDisplayText()}
                          </span>

                          {/* Warning for bypass without checkout time */}
                          {isBypassSchedule &&
                            !bypassCheckOutSpecified &&
                            isValidScheduledTime(scheduledKnockOut) && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                <AlertCircle className="h-3 w-3" />
                                <span>No check out time</span>
                              </div>
                            )}
                        </div>
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

                    {hasCustomTime && !isBypassSchedule && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600">
                        <Zap className="h-3 w-3" />
                        <span>
                          Custom times detected
                          {customTimes.checkIn && (
                            <span className="ml-1">
                              • In: {customTimes.checkIn}
                            </span>
                          )}
                          {customTimes.checkOut && (
                            <span className="ml-1">
                              • Out: {customTimes.checkOut}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

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
                                    return `Check-in in ${diffHours}h ${
                                      diffMins % 60
                                    }m`;
                                  }
                                  return `Check-in in ${diffMins}m`;
                                } else {
                                  const diffMs =
                                    now.getTime() - todayScheduled.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  if (diffMins > 60) {
                                    const diffHours = Math.floor(diffMins / 60);
                                    return `${diffHours}h ${
                                      diffMins % 60
                                    }m overdue`;
                                  }
                                  return `${diffMins}m overdue`;
                                }
                              } catch (error) {
                                return "Schedule error";
                              }
                            })()}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center space-x-6">
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
                  {(record.regularHours || record.overtimeHours) && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <div className="flex flex-col items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {regularHours.toFixed(1)}h
                          </span>
                          {overtimeHours > 0 && (
                            <span className="text-orange-600">
                              +{overtimeHours.toFixed(1)}h OT
                            </span>
                          )}
                        </div>
                        {overtimeHours > 0 &&
                          (overtimePay ? (
                            <div className="text-xs text-green-600 mt-1">
                              OT Pay: R{overtimePay.toFixed(2)}
                              <span className="text-xs text-gray-500 ml-1">
                                @ R
                                {safeDecimalToNumber(
                                  person.overtimeHourRate
                                ).toFixed(2)}
                                /hr
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">
                              OT rate not configured
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
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
                    {record.checkInLat && record.checkInLng && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>
                          {safeDecimalToNumber(record.checkInLat).toFixed(4)},{" "}
                          {safeDecimalToNumber(record.checkInLng).toFixed(4)}
                        </span>
                      </div>
                    )}
                    {record.notes && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="flex items-center cursor-help">
                            <span className="mr-1">Notes:</span>
                            <span className="truncate max-w-[200px]">
                              {record.notes}
                            </span>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto max-w-md">
                          <div className="text-sm">
                            <strong>Notes:</strong> {record.notes}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </div>
                  {isVirtualRecord && !record.checkIn && (
                    <div className="flex items-center text-orange-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {isLeaveStatus(record.status)
                          ? `On ${getStatusDisplayName(
                              record.status
                            ).toLowerCase()}`
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
