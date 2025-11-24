import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ timeEntryId: string }> }
) {
  try {
    const { timeEntryId } = await params;
    const body = await req.json();
    const { timeOut, image } = body;

    if (!timeEntryId) {
      return NextResponse.json(
        { error: "Time Entry ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch the existing entry to get the 'timeIn'
    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId },
      select: { id: true, timeIn: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Time Entry not found" },
        { status: 404 }
      );
    }

    // 2. Calculate Hours
    const startTime = new Date(existingEntry.timeIn).getTime();
    const endTime = new Date(timeOut).getTime();

    // Prevent negative time if system clocks are out of sync
    const durationMs = Math.max(0, endTime - startTime);
    const hours = durationMs / (1000 * 60 * 60);

    // 3. Update the entry
    const updatedEntry = await db.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        timeOut: new Date(timeOut),
        hours: Number(hours.toFixed(2)),
        images: image ? { push: image } : undefined,
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("[TIME_ENTRY_STOP_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}
