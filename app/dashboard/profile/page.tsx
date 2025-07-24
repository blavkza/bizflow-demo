import { getUserAuth } from "@/lib/auth";
import db from "@/lib/db";
import { ProfilePage } from "./_components/ProfilePage";

export default async function Page() {
  const { userId } = await getUserAuth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  const user = await db.user.findUnique({
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

  if (!user) {
    return <div>User not found</div>;
  }

  return <ProfilePage user={user} />;
}
