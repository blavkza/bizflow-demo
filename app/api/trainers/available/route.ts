import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeCurrent = searchParams.get("includeCurrent") === "true";
    const currentFreelancerId = searchParams.get("currentFreelancerId");

    let whereClause: any = {
      status: "ACTIVE",
    };

    // If we're not explicitly including the current one, we only want those without a user
    // OR we want to include the specific one being edited even if it has a user (which is the user itself)
    // The previous logic for employees was:
    // if (!includeCurrent) { whereClause.user = null; }
    // But that logic seems slightly flawed if querying all available. It works for "Create User" where you only want unlinked.
    // For "Update User", you might want unlinked + the one currently linked.

    // Let's stick to the employee logic for now, but if currentFreelancerId is provided, we should probably handle it within the query or filter client side?
    // The employee logic just fetched ALL active employees if includeCurrent is true? No, wait.

    // In employee route:
    /*
    if (!includeCurrent) {
      whereClause.user = null;
    }
    const employees = await db.employee.findMany(...)
    */
    // If includeCurrent is FALSE (default for create), it filters for user: null. Correct.
    // If includeCurrent is TRUE (for update), it removes the `user: null` filter, so it fetches ALL active employees regardless of linkage.
    // Then the UI disables those that are linked (`isLinked: employee.user !== null`) unless it matches the current ID.

    if (!includeCurrent) {
      whereClause.user = null;
    }

    const freelancers = await db.freeLancer.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    const availableFreelancers = freelancers.map((freelancer) => ({
      id: freelancer.id,
      freelancerNumber: freelancer.freeLancerNumber,
      firstName: freelancer.firstName,
      lastName: freelancer.lastName,
      email: freelancer.email,
      phone: freelancer.phone,
      position: freelancer.position,
      department: freelancer.department,
      status: freelancer.status,
      avatar: freelancer.avatar,
      isLinked: freelancer.user !== null,
    }));

    return NextResponse.json(availableFreelancers);
  } catch (error) {
    console.error("[AVAILABLE_FREELANCERS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
