import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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

    const body = await req.json();

    const validation = projectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      managerId,
      clientId,
      startDate,
      priority,
      endDate,
      deadline,
    } = validation.data;

    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access: Super admins can update any project, regular users need manager/team access
    if (!isSuperAdmin) {
      const hasAccess = await db.project.findFirst({
        where: {
          id,
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

      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have permission to update this project" },
          { status: 403 }
        );
      }
    }

    if (managerId) {
      const managerExists = await db.user.findUnique({
        where: { id: managerId },
      });

      if (!managerExists) {
        return NextResponse.json(
          { error: "Specified manager does not exist" },
          { status: 400 }
        );
      }
    }

    const project = await db.project.update({
      where: { id },
      data: {
        title,
        clientId,
        managerId,
        description,
        priority,
        startDate,
        endDate,
        deadline,
      },
      include: {
        manager: true,
      },
    });

    const notification = await db.notification.create({
      data: {
        title: "Project Update",
        message: `Project ${project.title} has been updated by ${user.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: user.id,
      },
    });

    if (project.manager?.employeeId) {
      await db.employeeNotification.create({
        data: {
          employeeId: project.manager.employeeId,
          title: "Project Updated",
          message: `Project ${project.title} : ${project.projectNumber} has been updated by ${user.name}.`,
          type: "EMPLOYEE",
          isRead: false,
          actionUrl: `/dashboard/profile`,
        },
      });
    }

    return NextResponse.json({ project, notification });
  } catch (error) {
    console.error("[PROJECT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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

    // Super admins can view any project without access restrictions
    const whereClause = isSuperAdmin
      ? { id }
      : {
          id,
          OR: [
            { managerId: user.id },
            {
              teamMembers: {
                some: { userId: user.id },
              },
            },
          ],
        };

    const project = await db.project.findFirst({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            phone2: true,
          },
        },
        manager: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        tasks: {
          include: {
            assignees: {
              select: { firstName: true, lastName: true, avatar: true },
            },
            freeLancerAssignees: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        Expense: {
          include: {
            Vendor: {
              select: { id: true, name: true, email: true },
            },
            category: {
              select: { id: true, name: true },
            },
          },
        },
        toolInterUses: {
          include: {
            tool: true,
          },
        },
        invoices: {
          include: {
            Expense: true,
          },
        },
        Folder: {
          include: {
            Document: true,
            Note: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            liked: true,
            createdAt: true,
            commenterName: true,
            commenterId: true,
            commenterAvatar: true,
            commenterRole: true,
            commentReply: {
              select: {
                id: true,
                content: true,
                liked: true,
                createdAt: true,
                commenterName: true,
                commenterId: true,
                commenterAvatar: true,
                commenterRole: true,
              },
            },
          },
        },
        documents: true,
        workLogs: true,
        teamMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization: Super admins can delete any project, managers can only delete their own
    if (!isSuperAdmin && project.managerId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to delete this project" },
        { status: 403 }
      );
    }

    // Use transaction to ensure all related data is handled properly
    await db.$transaction(async (tx) => {
      // Delete related records first to avoid foreign key constraints
      await tx.projectTeam.deleteMany({
        where: { projectId: id },
      });

      await tx.task.deleteMany({
        where: { projectId: id },
      });

      await tx.invoice.deleteMany({
        where: { projectId: id },
      });

      await tx.expense.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      });

      await tx.toolInterUse.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      });

      await tx.comment.deleteMany({
        where: { projectId: id },
      });

      // Delete the project
      await tx.project.delete({
        where: { id },
      });

      // Create notification
      await tx.notification.create({
        data: {
          title: "Project Deleted",
          message: `Project ${project.title} has been deleted by ${user.name}.`,
          type: "PROJECT",
          isRead: false,
          actionUrl: `/dashboard/projects`,
          userId: user.id,
        },
      });
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
