// lib/auth.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUserAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, role: null, clerkUser: null };
  }

  try {
    // Fetch user from Clerk
    const clerkUser = await (await clerkClient()).users.getUser(userId);

    // Fetch additional data from your database
    const user = await db.user.findUnique({
      where: { userId },
      select: {
        role: true,
      },
    });

    return {
      userId,
      role: user?.role || null,
      clerkUser,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { userId: null, role: null, clerkUser: null };
  }
}
