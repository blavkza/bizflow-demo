import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserType } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      email,
      phone,
      status,
      role,
      userType,
      employeeId,
      permissions,
    } = await req.json();

    console.log("Updating user with data:", {
      id,
      name,
      email,
      userType,
      employeeId,
      role,
      status,
    });

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 }
      );
    }

    // Validate employee linking for EMPLOYEE users
    if (
      userType === UserType.EMPLOYEE &&
      (!employeeId || employeeId === "no-employee")
    ) {
      return NextResponse.json(
        { error: "Employee must be selected for employee users" },
        { status: 400 }
      );
    }

    if (employeeId && employeeId !== "no-employee") {
      const existingEmployeeUser = await db.user.findFirst({
        where: {
          employeeId,
          id: { not: id },
        },
      });

      if (existingEmployeeUser) {
        return NextResponse.json(
          { error: "This employee is already linked to another user" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      status,
      role,
      userType,
      permissions: permissions || [],
    };

    // Handle employee linking/unlinking
    if (employeeId === "no-employee" || !employeeId) {
      updateData.employeeId = null;
    } else {
      updateData.employeeId = employeeId;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        userName: updatedUser.userName,
        role: updatedUser.role,
        status: updatedUser.status,
        userType: updatedUser.userType,
        employee: updatedUser.employee,
        permissions: updatedUser.permissions,
        phone: updatedUser.phone,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating User:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting User:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
