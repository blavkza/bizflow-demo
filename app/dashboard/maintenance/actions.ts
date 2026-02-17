"use server";

import db from "@/lib/db";
import {
  MaintenanceType,
  ServiceMaintenanceStatus,
  MaintenanceFrequency,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createMaintenance(data: {
  type: MaintenanceType;
  clientId: string;
  // Common details
  task: string;
  invoiceId?: string | null;
  recurringInvoiceId?: string | null;
  projectId?: string | null;
  status?: ServiceMaintenanceStatus;

  // For multiple locations (e.g. One-Off with multiple sites)
  visits: {
    location: string;
    date: Date;
    task?: string;
  }[];

  // For Routine
  frequency?: MaintenanceFrequency | null;
  customFrequencyMonths?: number | null;
  scheduleStart?: Date | null;
}) {
  try {
    // Basic validation
    if (data.visits.length === 0 && data.type === MaintenanceType.ONE_OFF) {
      // Allow creating without visits? Maybe, but user asked for "multiple locations each with its own date"
    }

    // We need a primary date and location for the parent record, maybe use the first visit?
    // Or make date/location optional on parent?
    // The schema still has `date` and `location` as required on Maintenance.
    // I will use the first visit's info as the "primary" info, or today's date if none.

    const primaryDate = data.visits[0]?.date || new Date();
    const primaryLocation = data.visits[0]?.location || "Multiple Locations";

    const maintenance = await db.maintenance.create({
      data: {
        type: data.type,
        client: { connect: { id: data.clientId } },
        date: primaryDate,
        location: primaryLocation,
        task: data.task,
        invoice: data.invoiceId
          ? { connect: { id: data.invoiceId } }
          : undefined,
        recurringInvoice: data.recurringInvoiceId
          ? { connect: { id: data.recurringInvoiceId } }
          : undefined,
        project: data.projectId
          ? { connect: { id: data.projectId } }
          : undefined,
        status: data.status || "PENDING",

        // Routine specific
        frequency: data.frequency,
        customFrequencyMonths: data.customFrequencyMonths,
        schedule: data.scheduleStart, // Using 'schedule' field for start date of routine

        visits: {
          create: data.visits.map((v) => ({
            location: v.location,
            date: v.date,
            task: v.task,
            status: "PENDING",
          })),
        },
      },
    });

    revalidatePath("/dashboard/maintenance");
    return { success: true, data: maintenance };
  } catch (error) {
    console.error("Failed to create maintenance:", error);
    return { success: false, error: "Failed to create maintenance" };
  }
}

export async function getMaintenances() {
  try {
    const maintenance = await db.maintenance.findMany({
      include: {
        client: true,
        invoice: true,
        recurringInvoice: true,
        project: true,
        visits: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    return { success: true, data: maintenance };
  } catch (error) {
    console.error("Failed to fetch maintenances:", error);
    return { success: false, error: "Failed to fetch maintenances" };
  }
}

export async function getMaintenanceById(id: string) {
  try {
    const maintenance = await db.maintenance.findUnique({
      where: { id },
      include: {
        client: true,
        invoice: true,
        recurringInvoice: {
          include: {
            invoices: {
              orderBy: {
                issueDate: "desc",
              },
            },
          },
        },
        project: true,
        visits: true,
      },
    });
    return { success: true, data: maintenance };
  } catch (error) {
    console.error("Failed to fetch maintenance:", error);
    return { success: false, error: "Failed to fetch maintenance" };
  }
}

export async function deleteMaintenance(id: string) {
  try {
    await db.maintenance.delete({
      where: { id },
    });
    revalidatePath("/dashboard/maintenance");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete maintenance:", error);
    return { success: false, error: "Failed to delete maintenance" };
  }
}

// Helper to fetch projects for the select dropdown
export async function getProjectsForSelect() {
  try {
    const projects = await db.project.findMany({
      select: {
        id: true,
        title: true,
        projectNumber: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100, // Limit to recent 100 projects
    });
    return projects;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export async function getClientsForSelect() {
  try {
    const clients = await db.client.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return clients;
  } catch (error) {
    return [];
  }
}

export async function updateMaintenance(
  id: string,
  data: Partial<{
    status: ServiceMaintenanceStatus;
    task: string;
    location: string;
    date: Date;
  }>,
) {
  try {
    const updated = await db.maintenance.update({
      where: { id },
      data,
    });
    revalidatePath(`/dashboard/maintenance/${id}`);
    revalidatePath("/dashboard/maintenance");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update maintenance:", error);
    return { success: false, error: "Failed to update maintenance" };
  }
}

export async function updateMaintenanceVisit(
  id: string,
  maintenanceId: string,
  data: Partial<{
    status: ServiceMaintenanceStatus;
    task: string;
    location: string;
    date: Date;
    completedAt: Date | null;
  }>,
) {
  try {
    const updated = await db.maintenanceVisit.update({
      where: { id },
      data,
    });
    revalidatePath(`/dashboard/maintenance/${maintenanceId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update visit:", error);
    return { success: false, error: "Failed to update visit" };
  }
}
