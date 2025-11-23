import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// 🛑 ASSUMPTION: You must have this imported:
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

  const { role } = await request.json();

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
        { error: "You do not have permission to update roles" },
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
        role,
      },
      include: {
        user: true,
      },
    });

    if (memberUser?.employeeId) {
      const message = `Your role in project "${project.title}" has been updated to "${role}" by ${creator.name}.`;

      await sendPushNotification({
        employeeId: memberUser.employeeId,
        title: "Project Role Updated",
        body: message,
        data: {
          projectId: project.id,
          url: `/dashboard/projects/${project.id}`,
        },
      });

      await db.employeeNotification.create({
        data: {
          employeeId: memberUser.employeeId,
          title: "Role Updated",
          message: message,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${project.id}`,
        },
      });
      console.log(
        `Role update notification sent to employee: ${memberUser.employeeId}`
      );
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[PROJECT_MEMBER_ROLE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
