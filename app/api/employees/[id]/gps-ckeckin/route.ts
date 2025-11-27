import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { canCheckByGPS } = body;

    // Update only the canCheckByGPS field
    const updatedEmployee = await db.employee.update({
      where: { id },
      data: { canCheckByGPS },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee GPS setting:", error);
    return NextResponse.json(
      { error: "Failed to update employee GPS setting" },
      { status: 500 }
    );
  }
}
