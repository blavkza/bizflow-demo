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

    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId },
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

    const updatedEntry = await db.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        timeOut: new Date(timeOut),
        hours: Math.max(0, Number(hours.toFixed(2))),
        images: updatedImages,
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error stopping timer:", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}
