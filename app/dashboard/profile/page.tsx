// app/profile/page.tsx
import { getUserAuth } from "@/lib/auth";
import db from "@/lib/db";
import { ProfilePage } from "./_components/ProfilePage";

export default async function Page() {
  const { userId, clerkUser } = await getUserAuth();

  if (!userId || !clerkUser) {
    return <div>Not authenticated</div>;
  }

  const dbUser = await db.user.findUnique({
    where: { userId },
    select: {
      id: true,
      userName: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      role: true,
      status: true,
      avatar: true,
    },
  });

  const clerkUsername =
    clerkUser.username ||
    clerkUser.firstName ||
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    dbUser?.email;

  const clerkUserEmail =
    clerkUser.emailAddresses?.[0]?.emailAddress || dbUser?.email;

  if (!dbUser) {
    return <div>User not found in database</div>;
  }

  // Combine data: use Clerk username if available, otherwise use DB username
  const user = {
    ...dbUser,
    userName: clerkUsername,
    email: clerkUserEmail,
    name: clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
      : dbUser.name,
  };

  return <ProfilePage user={user} />;
}
