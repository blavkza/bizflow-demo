import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentProject = await db.project.findUnique({
      where: { id },
      select: { starred: true, archived: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const newArchived = currentProject.starred ? data.archived : false;

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        starred: !currentProject.starred,
        archived: newArchived,
      },
    });

    return NextResponse.json(updatedProject);

    return NextResponse.json({
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating Project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
