import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const { subtaskId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const subtask = await db.subtask.update({
      where: { id: subtaskId },
      data: { status },
    });

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}
