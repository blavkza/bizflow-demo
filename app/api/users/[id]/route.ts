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
  },
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
      freelancerId,
      permissions,
    } = await req.json();

    console.log("Updating user with data:", {
      id,
      name,
      email,
      userType,
      employeeId,
      freelancerId,
      role,
      status,
    });

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 },
      );
    }

    // Validate employee linking for EMPLOYEE users
    if (
      userType === UserType.EMPLOYEE &&
      (!employeeId || employeeId === "no-employee")
    ) {
      return NextResponse.json(
        { error: "Employee must be selected for employee users" },
        { status: 400 },
      );
    }

    // Validate freelancer linking for FREELANCER users
    if (
      userType === UserType.FREELANCER &&
      (!freelancerId || freelancerId === "no-freelancer")
    ) {
      return NextResponse.json(
        { error: "Freelancer must be selected for freelancer users" },
        { status: 400 },
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
          { status: 400 },
        );
      }
    }

    if (freelancerId && freelancerId !== "no-freelancer") {
      const existingFreelancerUser = await db.user.findFirst({
        where: {
          freeLancerId: freelancerId,
          id: { not: id },
        },
      });

      if (existingFreelancerUser) {
        return NextResponse.json(
          { error: "This freelancer is already linked to another user" },
          { status: 400 },
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
      // If linking employee, ensure freelancer is unlinked (mutually exclusive usually, but schema allows both?)
      // Schema has separate fields, userType dictates primary role.
      // But typically a user is one or the other.
      // If userType is EMPLOYEE, let's clear freelancerId?
      if (userType === UserType.EMPLOYEE) {
        updateData.freeLancerId = null;
      }
    }

    // Handle freelancer linking/unlinking
    if (freelancerId === "no-freelancer" || !freelancerId) {
      // Only clear if we are not setting it (handled above by default null if not passed? No, existing data remains)
      // If explicit "no-freelancer" passed, clear it.
      if (freelancerId === "no-freelancer") updateData.freeLancerId = null;
    } else {
      updateData.freeLancerId = freelancerId;
      // If linking freelancer, ensure employee is unlinked
      if (userType === UserType.FREELANCER) {
        updateData.employeeId = null;
      }
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
        freeLancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            freeLancerNumber: true,
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
        freelancer: updatedUser.freeLancer,
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
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
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
      { status: 500 },
    );
  }
}
