import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

  const {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUploadFiles,
    canDeleteFiles,
    canViewFinancial,
  } = await request.json();

  try {
    const currentUserMembership = await db.project.findFirst({
      where: {
        id: params.id,
        managerId: creator.id,
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: "You do not have permission to update permissions" },
        { status: 403 }
      );
    }

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

    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member permissions" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { userId: currentUserId },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isManager = await db.project.findFirst({
      where: {
        id: params.id,
        managerId: currentUser.id,
      },
    });

    if (!isManager) {
      return NextResponse.json(
        { error: "You don't have permission to remove members" },
        { status: 403 }
      );
    }

    await db.projectTeam.delete({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: params.userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROJECT_MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
