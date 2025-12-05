import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BypassCheckResult {
  hasBypass: boolean;
  bypassCheckIn: boolean;
  bypassCheckOut: boolean;
  customCheckInTime?: string | null;
  customCheckOutTime?: string | null;
  rule?: any;
}

export async function checkAttendanceBypass(
  assigneeId: string,
  assigneeType: "employee" | "freelancer",
  date: Date
): Promise<BypassCheckResult> {
  try {
    // Build the where clause based on assignee type
    const where: any = {
      AND: [{ startDate: { lte: date } }, { endDate: { gte: date } }],
    };

    // Add assignee condition based on type
    if (assigneeType === "employee") {
      where.employees = {
        some: { id: assigneeId },
      };
    } else {
      where.freelancers = {
        some: { id: assigneeId },
      };
    }

    const bypassRule = await prisma.attendanceBypassRule.findFirst({
      where,
      include: {
        employees:
          assigneeType === "employee"
            ? {
                select: {
                  id: true,
                  employeeNumber: true,
                  firstName: true,
                  lastName: true,
                  position: true,
                  department: true,
                },
              }
            : false,
        freelancers:
          assigneeType === "freelancer"
            ? {
                select: {
                  id: true,
                  freeLancerNumber: true,
                  firstName: true,
                  lastName: true,
                  position: true,
                  department: true,
                },
              }
            : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!bypassRule) {
      return {
        hasBypass: false,
        bypassCheckIn: false,
        bypassCheckOut: false,
      };
    }

    return {
      hasBypass: true,
      bypassCheckIn: bypassRule.bypassCheckIn,
      bypassCheckOut: bypassRule.bypassCheckOut,
      customCheckInTime: bypassRule.customCheckInTime,
      customCheckOutTime: bypassRule.customCheckOutTime,
      rule: bypassRule,
    };
  } catch (error) {
    console.error("Error checking attendance bypass:", error);
    return {
      hasBypass: false,
      bypassCheckIn: false,
      bypassCheckOut: false,
    };
  }
}

// Function to check multiple assignees at once with optimized query
export async function checkMultipleAttendanceBypass(
  assignees: Array<{
    id: string;
    type: "employee" | "freelancer";
  }>,
  date: Date
): Promise<Record<string, BypassCheckResult>> {
  try {
    const results: Record<string, BypassCheckResult> = {};

    // Separate employees and freelancers for optimized queries
    const employeeIds = assignees
      .filter((a) => a.type === "employee")
      .map((a) => a.id);

    const freelancerIds = assignees
      .filter((a) => a.type === "freelancer")
      .map((a) => a.id);

    // Find rules for employees
    if (employeeIds.length > 0) {
      const employeeRules = await prisma.attendanceBypassRule.findMany({
        where: {
          AND: [
            { startDate: { lte: date } },
            { endDate: { gte: date } },
            {
              employees: {
                some: {
                  id: { in: employeeIds },
                },
              },
            },
          ],
        },
        include: {
          employees: {
            where: {
              id: { in: employeeIds },
            },
            select: {
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Map results for employees
      employeeIds.forEach((employeeId) => {
        const rule = employeeRules.find((rule) =>
          rule.employees.some((emp) => emp.id === employeeId)
        );

        results[employeeId] = rule
          ? {
              hasBypass: true,
              bypassCheckIn: rule.bypassCheckIn,
              bypassCheckOut: rule.bypassCheckOut,
              customCheckInTime: rule.customCheckInTime,
              customCheckOutTime: rule.customCheckOutTime,
              rule,
            }
          : {
              hasBypass: false,
              bypassCheckIn: false,
              bypassCheckOut: false,
            };
      });
    }

    // Find rules for freelancers
    if (freelancerIds.length > 0) {
      const freelancerRules = await prisma.attendanceBypassRule.findMany({
        where: {
          AND: [
            { startDate: { lte: date } },
            { endDate: { gte: date } },
            {
              freelancers: {
                some: {
                  id: { in: freelancerIds },
                },
              },
            },
          ],
        },
        include: {
          freelancers: {
            where: {
              id: { in: freelancerIds },
            },
            select: {
              id: true,
              freeLancerNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Map results for freelancers
      freelancerIds.forEach((freelancerId) => {
        const rule = freelancerRules.find((rule) =>
          rule.freelancers.some((f) => f.id === freelancerId)
        );

        results[freelancerId] = rule
          ? {
              hasBypass: true,
              bypassCheckIn: rule.bypassCheckIn,
              bypassCheckOut: rule.bypassCheckOut,
              customCheckInTime: rule.customCheckInTime,
              customCheckOutTime: rule.customCheckOutTime,
              rule,
            }
          : {
              hasBypass: false,
              bypassCheckIn: false,
              bypassCheckOut: false,
            };
      });
    }

    // Handle any assignees that weren't found in either query
    assignees.forEach((assignee) => {
      if (!results[assignee.id]) {
        results[assignee.id] = {
          hasBypass: false,
          bypassCheckIn: false,
          bypassCheckOut: false,
        };
      }
    });

    return results;
  } catch (error) {
    console.error("Error checking multiple attendance bypass:", error);

    // Return default results for all assignees on error
    const defaultResults: Record<string, BypassCheckResult> = {};
    assignees.forEach((assignee) => {
      defaultResults[assignee.id] = {
        hasBypass: false,
        bypassCheckIn: false,
        bypassCheckOut: false,
      };
    });

    return defaultResults;
  }
}

// New function: Check if any bypass exists for a specific time and assignee
export async function checkTimeSpecificBypass(
  assigneeId: string,
  assigneeType: "employee" | "freelancer",
  date: Date,
  checkType: "checkIn" | "checkOut"
): Promise<{
  hasBypass: boolean;
  customTime?: string | null;
  rule?: any;
}> {
  try {
    const where: any = {
      AND: [{ startDate: { lte: date } }, { endDate: { gte: date } }],
    };

    // Add time bypass condition
    if (checkType === "checkIn") {
      where.bypassCheckIn = true;
    } else {
      where.bypassCheckOut = true;
    }

    // Add assignee condition
    if (assigneeType === "employee") {
      where.employees = {
        some: { id: assigneeId },
      };
    } else {
      where.freelancers = {
        some: { id: assigneeId },
      };
    }

    const bypassRule = await prisma.attendanceBypassRule.findFirst({
      where,
      include: {
        employees:
          assigneeType === "employee"
            ? {
                where: { id: assigneeId },
                select: {
                  id: true,
                  employeeNumber: true,
                  firstName: true,
                  lastName: true,
                },
              }
            : false,
        freelancers:
          assigneeType === "freelancer"
            ? {
                where: { id: assigneeId },
                select: {
                  id: true,
                  freeLancerNumber: true,
                  firstName: true,
                  lastName: true,
                },
              }
            : false,
      },
    });

    if (!bypassRule) {
      return {
        hasBypass: false,
      };
    }

    return {
      hasBypass: true,
      customTime:
        checkType === "checkIn"
          ? bypassRule.customCheckInTime
          : bypassRule.customCheckOutTime,
      rule: bypassRule,
    };
  } catch (error) {
    console.error(`Error checking ${checkType} bypass:`, error);
    return {
      hasBypass: false,
    };
  }
}

// Helper function to process attendance with bypass rules
export async function processAttendanceWithBypass(
  assigneeId: string,
  assigneeType: "employee" | "freelancer",
  checkTime: Date,
  checkType: "checkIn" | "checkOut"
): Promise<{
  isAllowed: boolean;
  bypassApplied: boolean;
  customTime?: string | null;
  originalTime?: Date;
  adjustedTime?: Date;
  message?: string;
}> {
  try {
    // Check for bypass rules
    const bypassCheck = await checkTimeSpecificBypass(
      assigneeId,
      assigneeType,
      checkTime,
      checkType
    );

    // If no bypass, use normal processing
    if (!bypassCheck.hasBypass) {
      return {
        isAllowed: true, // Your normal validation logic here
        bypassApplied: false,
        originalTime: checkTime,
      };
    }

    // Bypass exists - check if custom time is specified
    if (bypassCheck.customTime && bypassCheck.customTime !== "none") {
      // Parse custom time
      const [hours, minutes] = bypassCheck.customTime.split(":").map(Number);
      const customDateTime = new Date(checkTime);
      customDateTime.setHours(hours, minutes, 0, 0);

      return {
        isAllowed: true,
        bypassApplied: true,
        customTime: bypassCheck.customTime,
        originalTime: checkTime,
        adjustedTime: customDateTime,
        message: `Used custom ${checkType} time: ${bypassCheck.customTime}`,
      };
    }

    // Bypass exists with no specific time - no time restrictions
    return {
      isAllowed: true,
      bypassApplied: true,
      originalTime: checkTime,
      message: `${checkType} time restrictions bypassed`,
    };
  } catch (error) {
    console.error("Error processing attendance with bypass:", error);
    return {
      isAllowed: false,
      bypassApplied: false,
      message: "Error processing attendance",
    };
  }
}
