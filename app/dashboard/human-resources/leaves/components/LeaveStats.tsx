import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveRequest } from "../types";
import { AlertCircle, CheckCircle, XCircle, Calendar } from "lucide-react";

interface LeaveStatsProps {
  leaveRequests: LeaveRequest[];
}

export default function LeaveStats({ leaveRequests }: LeaveStatsProps) {
  const pendingCount = leaveRequests.filter(
    (r) => r.status === "PENDING"
  ).length;
  const approvedCount = leaveRequests.filter(
    (r) => r.status === "APPROVED"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (r) => r.status === "REJECTED"
  ).length;

  const stats = [
    {
      title: "Pending Requests",
      value: pendingCount,
      description: "Awaiting approval",
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    {
      title: "Approved",
      value: approvedCount,
      description: "This month",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Rejected",
      value: rejectedCount,
      description: "This month",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Total Requests",
      value: leaveRequests.length,
      description: "All time",
      icon: Calendar,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
