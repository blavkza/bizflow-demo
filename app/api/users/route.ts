import db from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      name,
      password,
      email,
      role,
      userName,
      userType,
      employeeId,
      freelancerId,
      permissions,
      phone,
      status,
      traineeId,
    } = body;

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 },
      );
    }

    if (userType === UserType.EMPLOYEE && !employeeId) {
      return NextResponse.json(
        { error: "Employee must be selected for employee users" },
        { status: 400 },
      );
    }

    if (userType === UserType.TRAINEE && !traineeId) {
      return NextResponse.json(
        { error: "Trainee must be selected for trainee users" },
        { status: 400 },
      );
    }

    // Check if employee is already linked to a user (only if employeeId is provided)
    if (employeeId) {
      const existingEmployeeUser = await db.user.findFirst({
        where: { employeeId },
      });

      if (existingEmployeeUser) {
        return NextResponse.json(
          { error: "This employee is already linked to another user" },
          { status: 400 },
        );
      }
    }

    // Check if freelancer is already linked to a user
    if (freelancerId) {
      const existingFreelancerUser = await db.user.findFirst({
        where: { freeLancerId: freelancerId },
      });

      if (existingFreelancerUser) {
        return NextResponse.json(
          { error: "This freelancer is already linked to another user" },
          { status: 400 },
        );
      }
    }

    // Check if trainee is already linked to a user
    if (traineeId) {
      const existingTraineeUser = await db.user.findFirst({
        where: { traineeId },
      });

      if (existingTraineeUser) {
        return NextResponse.json(
          { error: "This trainee is already linked to another user" },
          { status: 400 },
        );
      }
    }

    const client = await clerkClient();

    // Create user in Clerk
    const clerkUser = await client.users.createUser({
      username: userName,
      password: password,
      emailAddress: [email],
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" ") || "",
    });

    const userData: any = {
      userId: clerkUser.id,
      name,
      email,
      role,
      userName,
      userType,
      phone: phone || null,
      status,
      permissions: permissions || [], // All users can have permissions
    };

    // Link employee if provided (for both ADMIN and EMPLOYEE users)
    if (employeeId) {
      userData.employeeId = employeeId;
    }

    // Link freelancer if provided
    if (freelancerId) {
      userData.freeLancerId = freelancerId;
    }

    // Link trainee if provided
    if (traineeId) {
      userData.traineeId = traineeId;
    }

    const user = await db.user.create({
      data: userData,
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

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[USER CREATION ERROR]", error);

    if (error?.errors?.[0]?.code === "form_identifier_exists") {
      return NextResponse.json(
        { error: "A user with this email or username already exists" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await db.user.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            avatar: true,
          },
        },
        freeLancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            avatar: true, // Assuming avatar exists on Freelancer model too, if not remove or check schema
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[User ERROR]", error);
    return NextResponse.error();
  }
}
