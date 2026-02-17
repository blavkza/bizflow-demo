"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, Users, Shield, ShieldOff } from "lucide-react";

interface Trainer {
  status: string;
  salary: number;
  reliable: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface StatsCardProps {
  trainers: Trainer[];
  departments: Department[];
}

export default function StatsCard({ trainers, departments }: StatsCardProps) {
  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter(
    (trainer) => trainer.status === "ACTIVE",
  ).length;
  const reliableTrainers = trainers.filter(
    (trainer) => trainer.reliable,
  ).length;
  const averageSalary =
    trainers.length > 0
      ? trainers.reduce((sum, trainer) => sum + trainer.salary, 0) /
        trainers.length
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrainers}</div>
          <p className="text-xs text-muted-foreground">
            Across all departments
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTrainers}</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Reliable Trainers
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reliableTrainers}</div>
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
