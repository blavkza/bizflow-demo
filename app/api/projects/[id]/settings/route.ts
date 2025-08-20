import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const data = await request.json();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const manager = await db.project.findUnique({
      where: {
        id: projectId,
        managerId: user.id,
      },
      select: {
        managerId: true,
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (data.archived === true) {
      data.starred = false;
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        archived: data.archived,
        status: data.status,
        priority: data.priority,
        starred: data.starred ?? undefined,
        budget: data.budget !== undefined ? data.budget : undefined,
        budgetSpent:
          data.budgetSpent !== undefined ? data.budgetSpent : undefined,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
