import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const { timeOut, photoUrl } = body;

    if (!timeOut) {
      return NextResponse.json(
        { error: "Time Out is required to stop timer" },
        { status: 400 }
      );
    }

    const existingEntry = await db.timeEntry.findUnique({
      where: { id },
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

    const result = await db.$transaction(async (tx) => {
      const updatedEntry = await tx.timeEntry.update({
        where: { id },
        data: {
          timeOut: new Date(timeOut),
          hours: Math.max(0, Number(hours.toFixed(2))),
          images: updatedImages,
        },
      });

      return {
        updatedEntry,
      };
    });

    console.log("[STOP_TIMER] Success:", result.updatedEntry.id);
    return NextResponse.json(result.updatedEntry);
  } catch (error: any) {
    console.error("[TIME_ENTRY_STOP_ERROR]", error);
    return NextResponse.json(
      { error: `Failed to stop timer: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
