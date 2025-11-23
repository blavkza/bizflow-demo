import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, hours, description, projectId, userId } = body;

    if (!projectId || !date || !hours || !description || !userId) {
      return NextResponse.json(
        {
          error:
            "Project ID, User ID, Date, Hours, and Description are required",
        },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { managerId: userId },
          {
            teamMembers: {
              some: { userId: userId },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    const workLog = await db.workLog.create({
      data: {
        date: new Date(date),
        hours: Number(hours),
        description,
        projectId: projectId,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const userName = user.name || "A user";

    if (project.managerId && project.managerId !== userId) {
      await db.notification.create({
        data: {
          title: "New Work Log Created",
          message: `Work Log for Project ${project.title} has been created by ${userName}.`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects/${project.id}`,
          userId: project.managerId,
        },
      });
    }

    return NextResponse.json(workLog);
  } catch (error) {
    console.error("[WORK_LOG_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
