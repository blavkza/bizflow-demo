import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    // In Next.js 15+, params must be awaited
    const { notificationId } = await params;
    const body = await request.json();
    const { isRead } = body;

    const updateData: any = {};

    if (isRead !== undefined) {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.readAt = new Date();
      } else {
        updateData.readAt = null;
      }
    }

    const notification = await db.employeeNotification.update({
      where: { id: notificationId },
      data: updateData,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);

    // Handle record not found specifically if needed
    // @ts-ignore
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
