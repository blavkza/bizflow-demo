import db from "@/lib/db";
import { projectSchema } from "@/lib/formValidationSchemas";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        message: `Project ${project.title} , has been Updated By ${creater.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json({ project, notification });
  } catch (error) {
    console.error("[DEPARTMENT_UPDADE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

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

    const project = await db.project.findFirst({
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
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        tasks: {
          include: {
            assignees: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            dueDate: true,
            status: true,
            totalAmount: true,
          },
        },
        Folder: { include: { Document: true, Note: true } },
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
        teamMembers: { include: { user: true } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "No access to this project or project not found" },
        { status: 403 }
      );
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
  { params }: { params: { id: string } }
) {
  const { id } = params;

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

  const project = await db.project.findUnique({
    where: {
      id,
      managerId: user.id,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.project.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Project Deleted",
        message: `Project ${project.title} , has been Deleted By ${user.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects`,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
