import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { timeEntryId: string } }
) {
  try {
    const { timeEntryId } = await params;
    const body = await request.json();
    const { timeOut, photoUrl } = body;

    if (!timeOut) {
      return NextResponse.json(
        { error: "Time Out is required to stop timer" },
        { status: 400 }
      );
    }

    // Get the time entry with its related task information
    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId },
      include: {
        task: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    const start = new Date(existingEntry.timeIn).getTime();
    const end = new Date(timeOut).getTime();
    const durationMs = end - start;
    const hours = durationMs / (1000 * 60 * 60);

    const updatedImages = existingEntry.images || [];
    if (photoUrl) {
      updatedImages.push(photoUrl);
    }

    // Update time entry and potentially the task status in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the time entry
      const updatedEntry = await tx.timeEntry.update({
        where: { id: timeEntryId },
        data: {
          timeOut: new Date(timeOut),
          hours: Math.max(0, Number(hours.toFixed(2))),
          images: updatedImages,
        },
      });

      // If the parent task status is "todo", update it to "inprogress"
      if (existingEntry?.task?.status === "TODO") {
        await tx.task.update({
          where: { id: existingEntry.task.id },
          data: { status: "IN_PROGRESS" },
        });
      }

      return {
        updatedEntry,
        taskUpdated: existingEntry?.task?.status === "TODO",
      };
    });

    return NextResponse.json(result.updatedEntry);
  } catch (error) {
    console.error("Error stopping timer:", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}
