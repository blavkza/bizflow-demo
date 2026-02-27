import { inngest } from "./client";
import db from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";
import {
  sendPushNotification,
  sendPushFreelancer,
  sendPushTrainee,
} from "@/lib/expo";

/**
 * Helper to get current SAST date and time components
 */
function getSASTNow() {
  const now = new Date();
  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = sastFormatter.formatToParts(now);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hour}:${minute}`,
    hour: parseInt(hour),
    minute: parseInt(minute),
    now,
  };
}

/**
 * Cron function that runs every working day at 12:00 PM SAST (configured below).
 * It fans out to process each worker individually for availability check.
 */
export const overtimeAvailabilityCron = inngest.createFunction(
  { id: "overtime-availability-cron" },
  { cron: "TZ=Africa/Johannesburg 0 12 * * 1-6" }, // Matching user's requested time if it was
  async ({ step }) => {
    console.log("Inngest: Starting overtimeAvailabilityCron...");
    // 1. Fetch all active workers
    const workers = await step.run("fetch-active-workers", async () => {
      const [employees, freelancers, trainees] = await Promise.all([
        db.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true },
        }),
        db.freeLancer.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true },
        }),
        db.trainee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true },
        }),
      ]);

      return [
        ...employees.map((e) => ({
          id: e.id,
          type: "EMPLOYEE",
          name: `${e.firstName} ${e.lastName}`,
        })),
        ...freelancers.map((f) => ({
          id: f.id,
          type: "FREELANCER",
          name: `${f.firstName} ${f.lastName}`,
        })),
        ...trainees.map((t) => ({
          id: t.id,
          type: "TRAINEE",
          name: `${t.firstName} ${t.lastName}`,
        })),
      ];
    });

    // 2. Fan out: send an event for each worker
    const events = workers.map((worker) => ({
      name: "app/overtime.availability.process",
      data: {
        workerId: worker.id,
        workerType: worker.type,
        workerName: worker.name,
      },
    }));

    await step.sendEvent("fan-out-overtime-availability", events);

    return { message: `Fanned out ${events.length} availability checks` };
  },
);

/**
 * Individual worker process function triggered by the fan-out event.
 * Handles database creation and push notification for availability.
 */
export const processOvertimeAvailability = inngest.createFunction(
  { id: "process-overtime-availability" },
  { event: "app/overtime.availability.process" },
  async ({ event, step }) => {
    const { workerId, workerType, workerName } = event.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availability = await step.run(
      "create-overtime-availability",
      async () => {
        // Check if one already exists for today to avoid duplicates
        const existing = await db.overtimeAvailability.findFirst({
          where: {
            date: today,
            employeeId: workerType === "EMPLOYEE" ? workerId : undefined,
            freeLancerId: workerType === "FREELANCER" ? workerId : undefined,
            traineeId: workerType === "TRAINEE" ? workerId : undefined,
          },
        });

        if (existing) return existing;

        return db.overtimeAvailability.create({
          data: {
            employeeId: workerType === "EMPLOYEE" ? workerId : undefined,
            freeLancerId: workerType === "FREELANCER" ? workerId : undefined,
            traineeId: workerType === "TRAINEE" ? workerId : undefined,
            date: today,
            status: AvailabilityStatus.PENDING,
          },
        });
      },
    );

    await step.run("send-push-notification", async () => {
      const notificationData = {
        title: "Overtime Availability",
        body: `Hi ${workerName}, are you available for overtime today?`,
        data: {
          type: "OVERTIME_AVAILABILITY",
          availabilityId: availability.id,
        },
      };

      if (workerType === "EMPLOYEE") {
        await sendPushNotification({
          employeeId: workerId,
          ...notificationData,
        });
      } else if (workerType === "FREELANCER") {
        await sendPushFreelancer({
          freelancerId: workerId,
          ...notificationData,
        });
      } else if (workerType === "TRAINEE") {
        await sendPushTrainee({ traineeId: workerId, ...notificationData });
      }
    });

    return { success: true, availabilityId: availability.id };
  },
);

/**
 * Cron function that checks every 15 minutes for shifts that have ended.
 */
export const shiftOverReminderCron = inngest.createFunction(
  { id: "shift-over-reminder-cron" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    const { dateStr, timeStr } = getSASTNow();

    const activeRecords = await step.run("fetch-active-shifts", async () => {
      return (db as any).attendanceRecord.findMany({
        where: {
          OR: [
            { date: new Date(dateStr) },
            // Handle edge case where date object in DB might be slightly different
            {
              date: {
                gte: new Date(dateStr),
                lt: new Date(new Date(dateStr).getTime() + 86400000),
              },
            },
          ],
          checkOut: null,
          shiftReminderSent: false,
          scheduledKnockOut: { not: null },
        },
        include: {
          employee: true,
          freeLancer: true,
          trainee: true,
        },
      });
    });

    const overdueRecords = activeRecords.filter((record: any) => {
      if (!record.scheduledKnockOut) return false;
      return timeStr >= record.scheduledKnockOut;
    });

    if (overdueRecords.length === 0)
      return { message: "No overdue shifts found" };

    const events = overdueRecords.map((record: any) => {
      const person = record.employee || record.freeLancer || record.trainee;
      const type = record.employee
        ? "EMPLOYEE"
        : record.freeLancer
          ? "FREELANCER"
          : "TRAINEE";
      return {
        name: "app/shift.over.process",
        data: {
          recordId: record.id,
          workerId: person?.id,
          workerType: type,
          workerName: person
            ? `${person.firstName} ${person.lastName}`
            : "Worker",
        },
      };
    });

    await step.sendEvent("process-shift-over-notifications", events);

    return { message: `Fanned out ${events.length} shift over reminders` };
  },
);

/**
 * Handles individual shift over notification and DB update.
 */
export const processShiftOverReminder = inngest.createFunction(
  { id: "process-shift-over-reminder" },
  { event: "app/shift.over.process" },
  async ({ event, step }) => {
    const { recordId, workerId, workerType, workerName } = event.data;

    await step.run("send-shift-over-notification", async () => {
      const notificationData = {
        title: "Shift Over",
        body: `Hi ${workerName}, your shift is over. You can knock off or request for overtime.`,
        data: {
          type: "SHIFT_OVER",
          recordId: recordId,
        },
      };

      if (workerType === "EMPLOYEE") {
        await sendPushNotification({
          employeeId: workerId,
          ...notificationData,
        });
      } else if (workerType === "FREELANCER") {
        await sendPushFreelancer({
          freelancerId: workerId,
          ...notificationData,
        });
      } else if (workerType === "TRAINEE") {
        await sendPushTrainee({ traineeId: workerId, ...notificationData });
      }
    });

    await step.run("update-record-reminder-sent", async () => {
      await (db as any).attendanceRecord.update({
        where: { id: recordId },
        data: { shiftReminderSent: true },
      });
    });

    return { success: true };
  },
);

/**
 * Cron function that checks every 15 minutes for workers who forgot to knock off.
 */
export const autoShiftCheckoutCron = inngest.createFunction(
  { id: "auto-shift-checkout-cron" },
  { cron: "*/15 * * * *" }, // Run every 15 minutes
  async ({ step }) => {
    const { dateStr, hour, minute } = getSASTNow();
    const nowTotalMinutes = hour * 60 + minute;

    // Fetch records where shift is overdue by at least 35 minutes (30 mins + 5 grace)
    const activeRecords = await step.run("fetch-overdue-shifts", async () => {
      const records = await (db as any).attendanceRecord.findMany({
        where: {
          OR: [
            { date: new Date(dateStr) },
            {
              date: {
                gte: new Date(dateStr),
                lt: new Date(new Date(dateStr).getTime() + 86400000),
              },
            },
          ],
          checkOut: null,
          scheduledKnockOut: { not: null },
        },
        include: {
          employee: true,
          freeLancer: true,
          trainee: true,
        },
      });

      return records.filter((record: any) => {
        if (!record.scheduledKnockOut) return false;
        const [koHour, koMin] = record.scheduledKnockOut.split(":").map(Number);
        const koTotalMinutes = koHour * 60 + koMin;

        // Current time is at least 35 minutes past knock out
        return nowTotalMinutes >= koTotalMinutes + 35;
      });
    });

    if (activeRecords.length === 0)
      return { message: "No overdue shifts for auto-checkout" };

    const events = [];

    for (const record of activeRecords) {
      const personId =
        record.employeeId || record.freeLancerId || record.traineeId;
      const personType = record.employeeId
        ? "EMPLOYEE"
        : record.freeLancerId
          ? "FREELANCER"
          : "TRAINEE";

      // Check for overtime requests for this worker on this date
      const hasOvertimeRequest = await step.run(
        `check-overtime-${record.id}`,
        async () => {
          const otRequest = await db.overtimeRequest.findFirst({
            where: {
              date: record.date,
              OR: [
                { employeeId: record.employeeId },
                { freeLancerId: record.freeLancerId },
                { traineeId: record.traineeId },
              ],
            },
          });
          return !!otRequest;
        },
      );

      if (!hasOvertimeRequest) {
        const person = record.employee || record.freeLancer || record.trainee;
        events.push({
          name: "app/shift.auto_checkout.process",
          data: {
            recordId: record.id,
            workerId: personId,
            workerType: personType,
            workerName: person
              ? `${person.firstName} ${person.lastName}`
              : "Worker",
            scheduledKnockOut: record.scheduledKnockOut,
          },
        });
      }
    }

    if (events.length > 0) {
      await step.sendEvent("process-auto-checkouts", events);
    }

    return { message: `Fanned out ${events.length} auto-checkouts` };
  },
);

/**
 * Handles individual automatic checkout.
 */
export const processAutoShiftCheckout = inngest.createFunction(
  { id: "process-auto-shift-checkout" },
  { event: "app/shift.auto_checkout.process" },
  async ({ event, step }) => {
    const { recordId, workerId, workerType, workerName, scheduledKnockOut } =
      event.data;

    await step.run("force-checkout-in-db", async () => {
      // Create a date object for the scheduled knock out time
      const record = await db.attendanceRecord.findUnique({
        where: { id: recordId },
      });
      if (!record || record.checkOut) return;

      const [koHour, koMin] = scheduledKnockOut.split(":").map(Number);
      const checkOutTime = new Date(record.date);
      // Scheduled time in SAST (+2)
      checkOutTime.setUTCHours(koHour - 2, koMin, 0, 0);

      await db.attendanceRecord.update({
        where: { id: recordId },
        data: {
          checkOut: checkOutTime,
          notes:
            (record.notes ? record.notes + " | " : "") +
            "Automatically checked out (forgot to knock off)",
          status: "PRESENT" as any, // Default to present if they finished the shift
        },
      });
    });

    await step.run("send-auto-checkout-notification", async () => {
      const notificationData = {
        title: "Automatic Knock-Off",
        body: `Hi ${workerName}, you were automatically knocked off for your shift today because no overtime was requested and manual knock-off was missed.`,
        data: {
          type: "AUTO_CHECKOUT",
          recordId: recordId,
        },
      };

      if (workerType === "EMPLOYEE") {
        await sendPushNotification({
          employeeId: workerId,
          ...notificationData,
        });
      } else if (workerType === "FREELANCER") {
        await sendPushFreelancer({
          freelancerId: workerId,
          ...notificationData,
        });
      } else if (workerType === "TRAINEE") {
        await sendPushTrainee({ traineeId: workerId, ...notificationData });
      }
    });

    return { success: true };
  },
);

/**
 * Cron function that checks every 5 minutes for workers overstaying their breaks.
 */
export const breakReminderCron = inngest.createFunction(
  { id: "break-reminder-cron" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const activeBreaks = await step.run("fetch-active-breaks", async () => {
      return (db as any).breakRecord.findMany({
        where: {
          endTime: null,
          reminderSent: false,
        },
        include: {
          attendanceRecord: {
            include: {
              employee: true,
              freeLancer: true,
              trainee: true,
            },
          },
        },
      });
    });

    if (activeBreaks.length === 0) return { message: "No active breaks found" };
    const hrSettings = await step.run("fetch-hr-settings", async () => {
      return db.hRSettings.findFirst({ orderBy: { updatedAt: "desc" } });
    });

    const teaStart = hrSettings?.teaTimeWindowStart || "10:00";
    const teaEnd = hrSettings?.teaTimeWindowEnd || "11:00";
    const lunchStart = hrSettings?.lunchTimeWindowStart || "13:00";
    const lunchEnd = hrSettings?.lunchTimeWindowEnd || "14:00";
    const totalAllowed = hrSettings?.totalBreakDurationMinutes || 60;
    const breakReminderThreshold = hrSettings?.breakReminderMinutes || 5;

    const { timeStr } = getSASTNow();

    const overdueBreaks = activeBreaks.filter((br: any) => {
      const startTime = new Date(br.startTime);
      const elapsedMinutes =
        (new Date().getTime() - startTime.getTime()) / 60000;

      // Determine if this is likely a tea or lunch break based on current time or startTime
      // For simplicity, let's look at the windows in HR settings
      let allowed = totalAllowed / 2; // Default fallback

      const sParts = new Intl.DateTimeFormat("en-ZA", {
        timeZone: "Africa/Johannesburg",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(startTime);
      const getP = (type: string) =>
        sParts.find((p) => p.type === type)?.value || "00";
      const sTimeStr = `${getP("hour")}:${getP("minute")}`;

      if (sTimeStr >= teaStart && sTimeStr <= teaEnd) {
        // Tea break: typically shorter (e.g. 15-20 mins)
        // But if total is 60, maybe 30 is safer.
        allowed = 30;
      } else if (sTimeStr >= lunchStart && sTimeStr <= lunchEnd) {
        // Lunch break: typically longer (e.g. 40-60 mins)
        allowed = 60;
      }

      return elapsedMinutes >= allowed + breakReminderThreshold;
    });

    if (overdueBreaks.length === 0)
      return { message: "No overdue breaks found" };

    const events = overdueBreaks.map((br: any) => {
      const record = br.attendanceRecord;
      const person = record.employee || record.freeLancer || record.trainee;
      const type = record.employee
        ? "EMPLOYEE"
        : record.freeLancer
          ? "FREELANCER"
          : "TRAINEE";
      return {
        name: "app/break.over.process",
        data: {
          breakId: br.id,
          workerId: person?.id,
          workerType: type,
          workerName: person
            ? `${person.firstName} ${person.lastName}`
            : "Worker",
        },
      };
    });

    await step.sendEvent("process-break-over-notifications", events);

    return { message: `Fanned out ${events.length} break over reminders` };
  },
);

/**
 * Handles individual break over notification and forcibly ends the break in the DB.
 */
export const processBreakReminder = inngest.createFunction(
  { id: "process-break-over-reminder" },
  { event: "app/break.over.process" },
  async ({ event, step }) => {
    const { breakId, workerId, workerType, workerName } = event.data;

    const breakData = await step.run("fetch-break-details", async () => {
      return (db as any).breakRecord.findUnique({
        where: { id: breakId },
        include: { attendanceRecord: true },
      });
    });

    if (!breakData || breakData.endTime)
      return { success: false, message: "Break already ended" };

    const now = new Date();
    const startTime = new Date(breakData.startTime);
    const duration = Math.round((now.getTime() - startTime.getTime()) / 60000);

    await step.run("auto-end-break-in-db", async () => {
      await db.$transaction([
        // 1. End the break record
        (db as any).breakRecord.update({
          where: { id: breakId },
          data: {
            endTime: now,
            duration: duration,
            reminderSent: true,
          },
        }),
        // 2. Set worker back to PRESENT and update total duration
        db.attendanceRecord.update({
          where: { id: breakData.attendanceRecordId },
          data: {
            status: "PRESENT" as any,
            breakDuration: {
              increment: duration,
            },
          },
        }),
      ]);
    });

    await step.run("send-break-auto-ended-notification", async () => {
      const notificationData = {
        title: "Break Automatically Ended",
        body: `Hi ${workerName}, your break limit was reached. Your break has been automatically ended and you are marked as back on duty.`,
        data: {
          type: "BREAK_AUTO_ENDED",
          breakId: breakId,
          duration: duration,
        },
      };

      if (workerType === "EMPLOYEE") {
        await sendPushNotification({
          employeeId: workerId,
          ...notificationData,
        });
      } else if (workerType === "FREELANCER") {
        await sendPushFreelancer({
          freelancerId: workerId,
          ...notificationData,
        });
      } else if (workerType === "TRAINEE") {
        await sendPushTrainee({ traineeId: workerId, ...notificationData });
      }
    });

    return { success: true, autoEnded: true, finalDuration: duration };
  },
);
