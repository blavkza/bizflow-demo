import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, Users, UserX } from "lucide-react";
import { UserStatus, UserRole, UserType } from "@prisma/client";
import { User } from "@/types/user";

interface StatsCardProps {
  users: User[];
}

export default function StatsCard({ users }: StatsCardProps) {
  console.log(users);

  const activeUsers = users.filter(
    (u) => u.status === UserStatus.ACTIVE
  ).length;
  const totalUsers = users.length;

  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const usersCreatedLastMonthToToday = users.filter((user) => {
    const createdAtDate = new Date(user.createdAt);
    return createdAtDate >= firstDayLastMonth && createdAtDate <= now;
  });

  const adminTypeUsers = users.filter(
    (u) => u.userType === UserType.ADMIN
  ).length;

  const inactiveUsers = users.filter(
    (u) => u.status === UserStatus.INACTIVE || u.status === UserStatus.SUSPENDED
  ).length;

  const employeeUsers = users.filter(
    (u) => u.userType === UserType.EMPLOYEE
  ).length;

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
          {/* Choose which count to display */}
          <div className="text-2xl font-bold">{adminTypeUsers}</div>
          <p className="text-xs text-muted-foreground">System administrators</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Employee Users</CardTitle>
          <UserX className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employeeUsers}</div>
          <p className="text-xs text-muted-foreground">Linked to employees</p>
        </CardContent>
      </Card>
    </div>
  );
}
