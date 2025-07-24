import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getUserAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, role: null };
  }

  const user = await db.user.findUnique({
    where: { userId },
    select: {
      role: true,
    },
  });

  return {
    userId,
    role: user?.role || null,
  };
}
