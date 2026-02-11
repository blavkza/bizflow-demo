import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    const projectId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    const body = await req.json();
    const { date, hours, description } = body;

    // Validate required fields
    if (!date || !hours || !description) {
      return NextResponse.json(
        { error: "Date, hours, and description are required" },
        { status: 400 }
      );
    }

    // Check if project exists and user has access (super admins can create work logs on any project)
    const project = await db.project.findFirst({
      where: isSuperAdmin
        ? { id: projectId }
        : {
            id: projectId,
            OR: [
              { managerId: user.id },
              {
                teamMembers: {
                  some: { userId: user.id },
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
        hours,
        description,
        projectId: projectId,
        userId: user.id,
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

    await db.notification.create({
      data: {
        title: "New Work Log Created",
        message: `Work Log for Project ${project.title} has been created by ${user.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: user.id,
      },
    });

    return NextResponse.json(workLog);
  } catch (error) {
    console.error("[WORK_LOG_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    // Check if project exists and user has access (super admins can view work logs of any project)
    const project = await db.project.findFirst({
      where: isSuperAdmin
        ? { id: params.projectId }
        : {
            id: params.projectId,
            OR: [
              { managerId: user.id },
              {
                teamMembers: {
                  some: { userId: user.id },
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

    const workLogs = await db.workLog.findMany({
      where: {
        projectId: params.projectId,
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
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(workLogs);
  } catch (error) {
    console.error("[GET_WORK_LOGS_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    // Extract workLogId from URL search params
    const url = new URL(req.url);
    const workLogId = url.searchParams.get("workLogId");

    if (!workLogId) {
      return NextResponse.json(
        { error: "Work log ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: params.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Find the work log
    const workLog = await db.workLog.findFirst({
      where: { id: workLogId },
    });

    if (!workLog) {
      return NextResponse.json(
        { error: "Work log not found" },
        { status: 404 }
      );
    }

    // Check authorization:
    // - Super admins can delete any work log
    // - Project managers can delete any work log on their projects
    // - Team members can only delete their own work logs
    const isProjectManager = project.managerId === user.id;

    if (!isSuperAdmin && !isProjectManager && workLog.userId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to delete this work log" },
        { status: 403 }
      );
    }

    await db.workLog.delete({
      where: { id: workLogId },
    });

    // Create notification
    await db.notification.create({
      data: {
        title: "Work Log Deleted",
        message: `Work Log from ${new Date(workLog.date).toLocaleDateString()} for Project ${project.title} has been deleted by ${user.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Work log deleted successfully" });
  } catch (error) {
    console.error("[DELETE_WORK_LOG_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
