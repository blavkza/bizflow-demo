import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const body = await request.json();

    const projectId = body.projectId === "no-project" ? null : body.projectId;

    const result = await db.$transaction(async (tx) => {
      const interUse = await tx.toolInterUse.create({
        data: {
          toolId: params.id,
          projectId: projectId,
          useStartDate: new Date(body.useStartDate),
          useEndDate: new Date(body.useEndDate),
          status: body.status,
          notes: body.notes,
          damageReported: body.damageDescription ? true : false,
          damageDescription: body.damageDescription,
          relisedBy: user.name,
        },
      });

      if (body.status === "ACTIVE") {
        await tx.tool.update({
          where: { id: params.id },
          data: {
            status: "INTERUSE",
          },
        });
      }

      return interUse;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating internal use record:", error);
    return NextResponse.json(
      { error: "Failed to create internal use record" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const body = await request.json();
    const { interUseId, status, damageDescription } = body;

    if (!interUseId || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const updatedInterUse = await tx.toolInterUse.update({
        where: { id: interUseId },
        data: {
          status: status,
          damageReported: damageDescription ? true : false,
          damageDescription: damageDescription,
        },
      });

      const activeInterUses = await tx.toolInterUse.findMany({
        where: {
          toolId: params.id,
          status: "ACTIVE",
        },
      });

      let newToolStatus: "AVAILABLE" | "INTERUSE" = "AVAILABLE";

      if (activeInterUses.length > 0) {
        newToolStatus = "INTERUSE";
      } else {
        const pendingInterUses = await tx.toolInterUse.findMany({
          where: {
            toolId: params.id,
            status: "PENDING",
          },
        });

        if (pendingInterUses.length > 0) {
          newToolStatus = "AVAILABLE";
        }
      }

      await tx.tool.update({
        where: { id: params.id },
        data: {
          status: newToolStatus,
        },
      });

      return updatedInterUse;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating internal use record:", error);
    return NextResponse.json(
      { error: "Failed to update internal use record" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const interUses = await db.toolInterUse.findMany({
      where: {
        toolId: params.id,
      },
      include: {
        Project: {
          select: {
            id: true,
            projectNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(interUses);
  } catch (error) {
    console.error("Error fetching internal use records:", error);
    return NextResponse.json(
      { error: "Failed to fetch internal use records" },
      { status: 500 }
    );
  }
}
