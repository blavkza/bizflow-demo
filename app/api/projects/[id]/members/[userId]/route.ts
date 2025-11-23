import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/expo";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await db.user.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUploadFiles,
    canDeleteFiles,
    canViewFinancial,
  } = body;

  try {
    const project = await db.project.findFirst({
      where: {
        id: params.id,
        managerId: creator.id,
      },
      select: { title: true, id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "You do not have permission to update permissions" },
        { status: 403 }
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

    if (memberUser?.employeeId) {
      const message = `Your permissions for project "${project.title}" have been updated by ${creator.name}.`;

      await sendPushNotification({
        employeeId: memberUser.employeeId,
        title: "Permissions Updated",
        body: message,
        data: {
          projectId: project.id,
          url: `/dashboard/projects/${project.id}`,
        },
      });

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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[PROJECT_MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update member permissions" },
      { status: 500 }
    );
  }
}
