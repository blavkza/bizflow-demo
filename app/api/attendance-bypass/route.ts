import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { sendPushNotification } from "@/lib/expo";
import { format } from "date-fns";

// Notification types for bypass rules
type BypassNotificationType =
  | "BYPASS_CREATED"
  | "BYPASS_UPDATED"
  | "BYPASS_DELETED";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const freelancerId = searchParams.get("freelancerId");
    const date = searchParams.get("date");

    let where: any = {};

    // If checking for a specific date
    if (date) {
      const checkDate = new Date(date);
      where.AND = [
        { startDate: { lte: checkDate } },
        { endDate: { gte: checkDate } },
      ];
    }

    // Filter by employee or freelancer if provided
    if (employeeId) {
      where.employees = {
        some: { id: employeeId },
      };
    } else if (freelancerId) {
      where.freelancers = {
        some: { id: freelancerId },
      };
    }

    const bypassRules = await db.attendanceBypassRule.findMany({
      where,
      include: {
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            status: true,
          },
        },
        freelancers: {
          select: {
            id: true,
            freeLancerNumber: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            status: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({ bypassRules });
  } catch (error) {
    console.error("Error fetching bypass rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch bypass rules" },
      { status: 500 }
    );
  }
}

// POST /api/attendance-bypass - Create new bypass rule with multiple assignees
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(data.startDate);
    let endDate = new Date(data.endDate);

    // FIX: Set end date to end of day (23:59:59.999)
    if (startDate.toDateString() === endDate.toDateString()) {
      // For single-day rules, set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // For multi-day rules, set the end date to end of that day
      endDate.setHours(23, 59, 59, 999);
    }

    console.log(`Start Date: ${startDate.toISOString()}`);
    console.log(`End Date (adjusted): ${endDate.toISOString()}`);

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    // Validate time formats if provided
    if (
      data.customCheckInTime &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.customCheckInTime)
    ) {
      return NextResponse.json(
        { error: "Invalid check-in time format. Use HH:mm (24-hour format)" },
        { status: 400 }
      );
    }

    if (
      data.customCheckOutTime &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.customCheckOutTime)
    ) {
      return NextResponse.json(
        { error: "Invalid check-out time format. Use HH:mm (24-hour format)" },
        { status: 400 }
      );
    }

    // Check for overlapping rules for each assignee
    const employeeIds = data.employeeIds || [];
    const freelancerIds = data.freelancerIds || [];

    // Check employees
    if (employeeIds.length > 0) {
      const existingEmployeeRules = await db.attendanceBypassRule.findMany({
        where: {
          employees: {
            some: {
              id: { in: employeeIds },
            },
          },
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } },
          ],
        },
        include: {
          employees: {
            select: { id: true, employeeNumber: true },
          },
        },
      });

      if (existingEmployeeRules.length > 0) {
        const conflictingEmployees = existingEmployeeRules.flatMap((rule) =>
          rule.employees.filter((emp) => employeeIds.includes(emp.id))
        );

        if (conflictingEmployees.length > 0) {
          const employeeNumbers = conflictingEmployees
            .map((emp) => emp.employeeNumber)
            .join(", ");
          return NextResponse.json(
            {
              error: `Bypass rules already exist for employees: ${employeeNumbers} during the specified period`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Check freelancers
    if (freelancerIds.length > 0) {
      const existingFreelancerRules = await db.attendanceBypassRule.findMany({
        where: {
          freelancers: {
            some: {
              id: { in: freelancerIds },
            },
          },
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } },
          ],
        },
        include: {
          freelancers: {
            select: { id: true, freeLancerNumber: true },
          },
        },
      });

      if (existingFreelancerRules.length > 0) {
        const conflictingFreelancers = existingFreelancerRules.flatMap((rule) =>
          rule.freelancers.filter((f) => freelancerIds.includes(f.id))
        );

        if (conflictingFreelancers.length > 0) {
          const freelancerNumbers = conflictingFreelancers
            .map((f) => f.freeLancerNumber)
            .join(", ");
          return NextResponse.json(
            {
              error: `Bypass rules already exist for freelancers: ${freelancerNumbers} during the specified period`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Create the bypass rule with multiple assignees
    const bypassRule = await db.attendanceBypassRule.create({
      data: {
        startDate,
        endDate, // Now includes 23:59:59.999
        bypassCheckIn: data.bypassCheckIn || false,
        bypassCheckOut: data.bypassCheckOut || false,
        customCheckInTime: data.customCheckInTime || null,
        customCheckOutTime: data.customCheckOutTime || null,
        reason: data.reason || null,
        createdBy: creater.name || "system",
        // Connect employees and freelancers
        employees:
          employeeIds.length > 0
            ? {
                connect: employeeIds.map((id: any) => ({ id })),
              }
            : undefined,
        freelancers:
          freelancerIds.length > 0
            ? {
                connect: freelancerIds.map((id: any) => ({ id })),
              }
            : undefined,
      },
      include: {
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        freelancers: {
          select: {
            id: true,
            freeLancerNumber: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    console.log(`Bypass rule created:`);
    console.log(`  ID: ${bypassRule.id}`);
    console.log(`  Start: ${bypassRule.startDate}`);
    console.log(`  End: ${bypassRule.endDate}`);
    console.log(`  Custom Time: ${bypassRule.customCheckInTime}`);

    // Send BYPASS_CREATED notifications
    await sendBypassNotifications({
      type: "BYPASS_CREATED",
      rule: bypassRule,
      employeeIds,
      freelancerIds,
      data,
      startDate,
      endDate,
      createdBy: creater.name || "system",
    });

    return NextResponse.json(
      {
        message: "Bypass rule created successfully",
        bypassRule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bypass rule:", error);
    return NextResponse.json(
      { error: "Failed to create bypass rule" },
      { status: 500 }
    );
  }
}

// PUT /api/attendance-bypass/:id - Update bypass rule
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Check if rule exists
    const existingRule = await db.attendanceBypassRule.findUnique({
      where: { id },
      include: {
        employees: { select: { id: true } },
        freelancers: { select: { id: true } },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Bypass rule not found" },
        { status: 404 }
      );
    }

    // Get affected employee and freelancer IDs
    const existingEmployeeIds = existingRule.employees.map((emp) => emp.id);
    const existingFreelancerIds = existingRule.freelancers.map((f) => f.id);

    // Determine which assignees are being added or removed
    const updatedEmployeeIds = data.employeeIds || existingEmployeeIds;
    const updatedFreelancerIds = data.freelancerIds || existingFreelancerIds;

    const addedEmployeeIds = updatedEmployeeIds.filter(
      (id: string) => !existingEmployeeIds.includes(id)
    );
    const removedEmployeeIds = existingEmployeeIds.filter(
      (id) => !updatedEmployeeIds.includes(id)
    );

    const addedFreelancerIds = updatedFreelancerIds.filter(
      (id: string) => !existingFreelancerIds.includes(id)
    );
    const removedFreelancerIds = existingFreelancerIds.filter(
      (id) => !updatedFreelancerIds.includes(id)
    );

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingRule.startDate;
      const endDate = data.endDate
        ? new Date(data.endDate)
        : existingRule.endDate;

      if (startDate > endDate) {
        return NextResponse.json(
          { error: "Start date cannot be after end date" },
          { status: 400 }
        );
      }
    }

    // Update the bypass rule
    const updatedRule = await db.attendanceBypassRule.update({
      where: { id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        bypassCheckIn:
          data.bypassCheckIn !== undefined ? data.bypassCheckIn : undefined,
        bypassCheckOut:
          data.bypassCheckOut !== undefined ? data.bypassCheckOut : undefined,
        customCheckInTime:
          data.customCheckInTime !== undefined
            ? data.customCheckInTime
            : undefined,
        customCheckOutTime:
          data.customCheckOutTime !== undefined
            ? data.customCheckOutTime
            : undefined,
        reason: data.reason !== undefined ? data.reason : undefined,
        // Update employees if provided
        employees:
          data.employeeIds !== undefined
            ? {
                set: data.employeeIds.map((id: string) => ({ id })),
              }
            : undefined,
        // Update freelancers if provided
        freelancers:
          data.freelancerIds !== undefined
            ? {
                set: data.freelancerIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        freelancers: {
          select: {
            id: true,
            freeLancerNumber: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    // Send BYPASS_UPDATED notifications to all affected assignees
    const allAffectedEmployeeIds = [
      ...new Set([...existingEmployeeIds, ...updatedEmployeeIds]),
    ];
    const allAffectedFreelancerIds = [
      ...new Set([...existingFreelancerIds, ...updatedFreelancerIds]),
    ];

    await sendBypassNotifications({
      type: "BYPASS_UPDATED",
      rule: updatedRule,
      employeeIds: allAffectedEmployeeIds,
      freelancerIds: allAffectedFreelancerIds,
      data,
      startDate: updatedRule.startDate,
      endDate: updatedRule.endDate,
      createdBy: creater.name || "system",
      changes: {
        addedEmployees: addedEmployeeIds,
        removedEmployees: removedEmployeeIds,
        addedFreelancers: addedFreelancerIds,
        removedFreelancers: removedFreelancerIds,
        bypassCheckInChanged:
          data.bypassCheckIn !== undefined &&
          data.bypassCheckIn !== existingRule.bypassCheckIn,
        bypassCheckOutChanged:
          data.bypassCheckOut !== undefined &&
          data.bypassCheckOut !== existingRule.bypassCheckOut,
        datesChanged:
          (data.startDate &&
            new Date(data.startDate).getTime() !==
              existingRule.startDate.getTime()) ||
          (data.endDate &&
            new Date(data.endDate).getTime() !==
              existingRule.endDate.getTime()),
        reasonChanged:
          data.reason !== undefined && data.reason !== existingRule.reason,
      },
    });

    return NextResponse.json({
      message: "Bypass rule updated successfully",
      bypassRule: updatedRule,
    });
  } catch (error) {
    console.error("Error updating bypass rule:", error);
    return NextResponse.json(
      { error: "Failed to update bypass rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance-bypass/:id - Delete bypass rule
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    // Check if rule exists and get its data for notifications
    const existingRule = await db.attendanceBypassRule.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        freelancers: {
          select: {
            id: true,
            freeLancerNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Bypass rule not found" },
        { status: 404 }
      );
    }

    // Get employee and freelancer IDs for notifications
    const employeeIds = existingRule.employees.map((emp) => emp.id);
    const freelancerIds = existingRule.freelancers.map((f) => f.id);

    // Send BYPASS_DELETED notifications before deleting
    await sendBypassNotifications({
      type: "BYPASS_DELETED",
      rule: existingRule,
      employeeIds,
      freelancerIds,
      data: {
        reason: existingRule.reason,
        bypassCheckIn: existingRule.bypassCheckIn,
        bypassCheckOut: existingRule.bypassCheckOut,
      },
      startDate: existingRule.startDate,
      endDate: existingRule.endDate,
      createdBy: creater.name || "system",
    });

    // Delete the bypass rule (relations will be handled by db)
    await db.attendanceBypassRule.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Bypass rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bypass rule:", error);
    return NextResponse.json(
      { error: "Failed to delete bypass rule" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// HELPER FUNCTIONS FOR NOTIFICATIONS
// ---------------------------------------------------------

interface SendBypassNotificationsParams {
  type: BypassNotificationType;
  rule: any;
  employeeIds: string[];
  freelancerIds: string[];
  data: any;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  changes?: {
    addedEmployees?: string[];
    removedEmployees?: string[];
    addedFreelancers?: string[];
    removedFreelancers?: string[];
    bypassCheckInChanged?: boolean;
    bypassCheckOutChanged?: boolean;
    datesChanged?: boolean;
    reasonChanged?: boolean;
  };
}

async function sendBypassNotifications(params: SendBypassNotificationsParams) {
  const {
    type,
    rule,
    employeeIds,
    freelancerIds,
    data,
    startDate,
    endDate,
    createdBy,
    changes = {},
  } = params;

  try {
    // Get employee details for notifications
    if (employeeIds.length > 0) {
      const employees = await db.employee.findMany({
        where: {
          id: { in: employeeIds },
        },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          expoPushToken: true,
        },
      });

      // Create notifications for each employee
      const notificationPromises = employees.map(async (employee) => {
        try {
          // Determine notification title and message based on type
          const { title, message } = getNotificationContent(type, {
            rule,
            employee,
            data,
            startDate,
            endDate,
            createdBy,
            changes,
          });

          // Create database notification
          await db.employeeNotification.create({
            data: {
              employeeId: employee.id,
              title,
              message,
              type: "ATTENDANCE",
              isRead: false,
              metadata: {
                bypassRuleId: rule.id,
                notificationType: type,
                ruleDetails: {
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  bypassCheckIn: rule.bypassCheckIn,
                  bypassCheckOut: rule.bypassCheckOut,
                  reason: rule.reason,
                },
              },
            },
          });

          // Send push notification if employee has Expo token
          if (employee.expoPushToken) {
            try {
              await sendPushNotification({
                employeeId: employee.id,
                title,
                body:
                  message.length > 100
                    ? message.substring(0, 100) + "..."
                    : message,
                data: {
                  employeeId: employee.id,
                  type: type,
                  ruleId: rule.id,
                  action: "VIEW_BYPASS",
                },
              });
              console.log(
                `${type} push notification sent to employee ${employee.employeeNumber}`
              );
            } catch (pushError) {
              console.error(
                `Failed to send push notification to employee ${employee.employeeNumber}:`,
                pushError
              );
              // Continue even if push notification fails
            }
          }
        } catch (notificationError) {
          console.error(
            `Failed to create notification for employee ${employee.id}:`,
            notificationError
          );
          // Continue with other employees even if one fails
        }
      });

      // Wait for all notifications to be created (but don't fail if some fail)
      await Promise.allSettled(notificationPromises);
    }

    // Note: Freelancers don't have notifications in your schema
    // If you need freelancer notifications, you'll need to add a freelancer notification model
    console.log(
      `Sent ${type} notifications to ${employeeIds.length} employees and ${freelancerIds.length} freelancers`
    );
  } catch (error) {
    console.error(`Error sending ${type} notifications:`, error);
    // Don't throw error - notifications shouldn't break the main operation
  }
}

function getNotificationContent(
  type: BypassNotificationType,
  context: {
    rule: any;
    employee: any;
    data: any;
    startDate: Date;
    endDate: Date;
    createdBy: string;
    changes: any;
  }
): { title: string; message: string } {
  const { rule, employee, data, startDate, endDate, createdBy, changes } =
    context;

  const formattedStartDate = format(startDate, "MMM dd, yyyy");
  const formattedEndDate = format(endDate, "MMM dd, yyyy");
  const dateRange = `${formattedStartDate} to ${formattedEndDate}`;

  const bypassSettings = [];
  if (rule.bypassCheckIn) {
    if (rule.customCheckInTime && rule.customCheckInTime !== "none") {
      bypassSettings.push(`Check-in: ${rule.customCheckInTime}`);
    } else {
      bypassSettings.push("No check-in time restriction");
    }
  }
  if (rule.bypassCheckOut) {
    if (rule.customCheckOutTime && rule.customCheckOutTime !== "none") {
      bypassSettings.push(`Check-out: ${rule.customCheckOutTime}`);
    } else {
      bypassSettings.push("No check-out time restriction");
    }
  }

  const settingsText =
    bypassSettings.length > 0 ? `Settings: ${bypassSettings.join(", ")}` : "";

  switch (type) {
    case "BYPASS_CREATED":
      return {
        title: "Attendance Bypass Rule Created",
        message: `You have been added to an attendance bypass rule${rule.reason ? `: ${rule.reason}` : ""} (${dateRange}). ${settingsText}`,
      };

    case "BYPASS_UPDATED":
      let updateDetails = [];

      if (changes.datesChanged) {
        updateDetails.push(`dates updated to ${dateRange}`);
      }

      if (changes.bypassCheckInChanged) {
        updateDetails.push(
          `check-in bypass ${rule.bypassCheckIn ? "enabled" : "disabled"}`
        );
      }

      if (changes.bypassCheckOutChanged) {
        updateDetails.push(
          `check-out bypass ${rule.bypassCheckOut ? "enabled" : "disabled"}`
        );
      }

      if (changes.reasonChanged) {
        updateDetails.push(`reason updated to "${rule.reason || "None"}"`);
      }

      // Check if this employee was added or removed
      if (changes.addedEmployees?.includes(employee.id)) {
        updateDetails.push("you were added to this rule");
      } else if (changes.removedEmployees?.includes(employee.id)) {
        updateDetails.push("you were removed from this rule");
      }

      const updateText =
        updateDetails.length > 0
          ? `Changes: ${updateDetails.join(", ")}. `
          : "";

      return {
        title: "Attendance Bypass Rule Updated",
        message: `An attendance bypass rule you're part of has been updated. ${updateText}${settingsText}`,
      };

    case "BYPASS_DELETED":
      return {
        title: "Attendance Bypass Rule Deleted",
        message: `An attendance bypass rule you were part of (${dateRange}) has been deleted${rule.reason ? `: ${rule.reason}` : ""}.`,
      };

    default:
      return {
        title: "Attendance Bypass Notification",
        message: `There's been an update to an attendance bypass rule affecting you.`,
      };
  }
}
