"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, Users, Shield, ShieldOff } from "lucide-react";

interface Freelancer {
  status: string;
  salary: number;
  reliable: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface StatsCardProps {
  freelancers: Freelancer[];
  departments: Department[];
}

export default function StatsCard({
  freelancers,
  departments,
}: StatsCardProps) {
  const totalFreelancers = freelancers.length;
  const activeFreelancers = freelancers.filter(
    (freelancer) => freelancer.status === "ACTIVE"
  ).length;
  const reliableFreelancers = freelancers.filter(
    (freelancer) => freelancer.reliable
  ).length;
  const averageSalary =
    freelancers.length > 0
      ? freelancers.reduce((sum, freelancer) => sum + freelancer.salary, 0) /
        freelancers.length
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Freelancers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFreelancers}</div>
          <p className="text-xs text-muted-foreground">
            Across all departments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Freelancers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeFreelancers}</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Reliable Freelancers
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reliableFreelancers}</div>
          <p className="text-xs text-muted-foreground">Trusted performers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R
            {averageSalary.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">Daily Average</p>
        </CardContent>
      </Card>
    </div>
  );
}
