import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/expo";
import { UserRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      creator.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      creator.role === UserRole.ADMIN_MANAGER;

    const body = await request.json();
    const {
      canCreateTask,
      canEditTask,
      canDeleteTask,
      canUploadFiles,
      canDeleteFiles,
      canViewFinancial,
    } = body;

    // Check if project exists
    const project = await db.project.findFirst({
      where: { id: params.id },
      select: { title: true, id: true, managerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization: Super admins can update any project's member permissions,
    // Project managers can only update permissions on projects they manage
    if (!isSuperAdmin && project.managerId !== creator.id) {
      return NextResponse.json(
        { error: "You do not have permission to update permissions" },
        { status: 403 }
      );
    }

    // Check if the member exists in the project team
    const existingMember = await db.projectTeam.findUnique({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: params.userId,
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Member not found in this project" },
        { status: 404 }
      );
    }

    const memberUser = await db.user.findUnique({
      where: { id: params.userId },
      select: { employeeId: true, name: true },
    });

    const updatedMember = await db.projectTeam.update({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: params.userId,
        },
      },
      data: {
        canCreateTask,
        canEditTask,
        canDeleteTask,
        canUploadFiles,
        canDeleteFiles,
        canViewFinancial,
      },
      include: {
        user: true,
      },
    });

    // Send notifications to the member
    if (memberUser?.employeeId) {
      const message = `Your permissions for project "${project.title}" have been updated by ${creator.name}.`;

      // Send push notification
      await sendPushNotification({
        employeeId: memberUser.employeeId,
        title: "Permissions Updated",
        body: message,
        data: {
          projectId: project.id,
          url: `/dashboard/projects/${project.id}`,
        },
      });

      // Create employee notification
      await db.employeeNotification.create({
        data: {
          employeeId: memberUser.employeeId,
          title: "Permissions Updated",
          message: message,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${project.id}`,
        },
      });
    }

    // Create notification for the creator
    await db.notification.create({
      data: {
        title: "Permissions Updated",
        message: `Updated permissions for ${memberUser?.name || "team member"} on project "${project.title}".`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[PROJECT_MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update member permissions" },
      { status: 500 }
    );
  }
}
