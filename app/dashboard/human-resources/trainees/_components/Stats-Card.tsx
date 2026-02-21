"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, DollarSign, Users, Shield, ShieldOff } from "lucide-react";

interface Trainee {
  status: string;
  salary: number;
  reliable: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface StatsCardProps {
  trainees: Trainee[];
  departments: Department[];
}

export default function StatsCard({ trainees, departments }: StatsCardProps) {
  const totalTrainees = trainees.length;
  const activeTrainees = trainees.filter(
    (trainee) => trainee.status === "ACTIVE",
  ).length;
  const reliableTrainees = trainees.filter(
    (trainee) => trainee.reliable,
  ).length;
  const averageSalary =
    trainees.length > 0
      ? trainees.reduce((sum, trainee) => sum + trainee.salary, 0) /
        trainees.length
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold  ">Total Trainees</CardTitle>
          <div className="p-2 rounded-lg text-white">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl  ">{totalTrainees}</div>
          <p className=" mt-1">Across {departments.length} departments</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold ">Active Status</CardTitle>
          <div className="p-2 rounded-lg text-white">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl  text-emerald-900">{activeTrainees}</div>
          <p className=" mt-1">Currently engaged in training</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold ">Reliability</CardTitle>
          <div className="p-2 rounded-lg text-white">
            <Shield className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl  text-sky-900">{reliableTrainees}</div>
          <p className=" mt-1">Meets performance standards</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold ">Avg Daily Rate</CardTitle>
          <div className="p-2 rounded-lg text-white">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl  text-amber-900">
            {new Intl.NumberFormat("en-ZA", {
              style: "currency",
              currency: "ZAR",
            }).format(averageSalary)}
          </div>
          <p className=" mt-1">Average daily investment</p>
        </CardContent>
      </Card>
    </div>
  );
}
