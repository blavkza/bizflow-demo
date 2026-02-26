import { inngest } from "./client";
import db from "@/lib/db";
import { AvailabilityStatus } from "@prisma/client";
import {
  sendPushNotification,
  sendPushFreelancer,
  sendPushTrainee,
} from "@/lib/expo";

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
