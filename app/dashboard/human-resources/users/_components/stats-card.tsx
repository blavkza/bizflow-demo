import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, Users, UserX } from "lucide-react";
import { User } from "@prisma/client";

interface StatsCardProps {
  users: {
    id: string;
    name: string;
    userName: string;
    email: string;
    role: string;
    avatar: string | null;
    status: string;
    createdAt: Date;
  }[];
}

export default function StatsCard({ users }: StatsCardProps) {
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const totalUsers = users.length;

  const now = new Date();

  // First day of last month
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Now filter users created after or on that date
  const usersCreatedLastMonthToToday = users.filter((user) => {
    const createdAtDate = new Date(user.createdAt);
    return createdAtDate >= firstDayLastMonth && createdAtDate <= now;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{usersCreatedLastMonthToToday.length} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((activeUsers / totalUsers) * 100)}% of total
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admins</CardTitle>
          <Shield className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {users.filter((u) => u.role === "SUPER_ADMIN").length}
          </div>
          <p className="text-xs text-muted-foreground">System administrators</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserX className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {
              users.filter(
                (u) => u.status === "INACTIVE" || u.status === "SUSPENDED"
              ).length
            }
          </div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </CardContent>
      </Card>
    </div>
  );
}
