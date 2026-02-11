import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
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
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        managerId: true,
        title: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization: Super admins can update any project, managers can only update their own
    if (!isSuperAdmin && project.managerId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to update this project" },
        { status: 403 }
      );
    }

    // If archiving, remove from starred
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

    // Create notification for significant changes
    if (data.archived !== undefined || data.status !== undefined) {
      await db.notification.create({
        data: {
          title: "Project Updated",
          message: `Project ${project.title} has been updated by ${user.name}.${
            data.archived !== undefined
              ? data.archived
                ? " Project archived."
                : " Project unarchived."
              : ""
          }${
            data.status !== undefined
              ? ` Status changed to ${data.status}.`
              : ""
          }`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${project.id}`,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
