import db from "@/lib/db";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/expo";

const ProjectTeamCreateSchema = z.array(
  z.object({
    userId: z.string().min(1, "User ID is required"),
    role: z.string().min(1, "Role is required"),
    canCreateTask: z.boolean().default(false),
    canEditTask: z.boolean().default(false),
    canDeleteTask: z.boolean().default(false),
    canUploadFiles: z.boolean().default(false),
    canDeleteFiles: z.boolean().default(false),
    canViewFinancial: z.boolean().default(false),
  })
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params?.id;

    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    const body = await request.json();
    const validation = ProjectTeamCreateSchema.safeParse(body.members);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { teamMembers: true },
    });

    if (!project) {
      return new NextResponse("Project not found or unauthorized", {
        status: 404,
      });
    }

    const existingMemberIds = project.teamMembers.map((m) => m.userId);
    const newMembers = validation.data.filter(
      (m) => !existingMemberIds.includes(m.userId)
    );

    if (newMembers.length === 0) {
      return new NextResponse("All users are already team members", {
        status: 400,
      });
    }

    const usersToAdd = await db.user.findMany({
      where: {
        id: { in: newMembers.map((m) => m.userId) },
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
      },
    });

    const createdMembers = await db.$transaction(
      newMembers.map((member) =>
        db.projectTeam.create({
          data: {
            projectId,
            userId: member.userId,
            role: member.role,
            canCreateTask: member.canCreateTask,
            canEditTask: member.canEditTask,
            canDeleteTask: member.canDeleteTask,
            canUploadFiles: member.canUploadFiles,
            canDeleteFiles: member.canDeleteFiles,
            canViewFinancial: member.canViewFinancial,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        })
      )
    );

    const notificationPromises = usersToAdd
      .filter((user) => user.employeeId)
      .map((user) =>
        db.employeeNotification.create({
          data: {
            employeeId: user.employeeId!,
            title: "Added to Project",
            message: `You have been added to the project "${project.title}" by ${creator.name}. Role: ${
              newMembers.find((m) => m.userId === user.id)?.role || "Member"
            }`,
            type: "PROJECT",
            isRead: false,
            actionUrl: `/dashboard/projects/${project.id}`,
          },
        })
      );

    await Promise.all(notificationPromises);

    const pushPromises = usersToAdd
      .filter((user) => user.employeeId)
      .map((user) => {
        const role =
          newMembers.find((m) => m.userId === user.id)?.role || "Member";

        return sendPushNotification({
          employeeId: user.employeeId!,
          title: "New Project Assignment",
          body: `You are now a ${role} on project "${project.title}".`,
          data: {
            projectId: project.id,
            url: `/dashboard/projects/${project.id}`,
          },
        });
      });

    await Promise.all(pushPromises);
    console.log(`Push notifications sent to ${pushPromises.length} employees.`);

    await db.notification.create({
      data: {
        title: "New Members Added",
        message: `New members added to project: ${project.title} by ${creator.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json(createdMembers, { status: 201 });
  } catch (error) {
    console.error("[PROJECT_TEAM_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
