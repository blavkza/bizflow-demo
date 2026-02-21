"use client";
import { Calendar, DollarSign, User, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TraineeWithDetails } from "../../type";

interface StatsCardProps {
  trainee: TraineeWithDetails;
}

export default function StatsCard({ trainee }: StatsCardProps) {
  const totalPaid =
    trainee.payments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    ) || 0;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trainee ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainee.traineeNumber}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(trainee.hireDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(trainee.salary))}
            </div>
            <p className="text-xs text-muted-foreground">Per Day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Current total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reliability</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainee.reliable ? "Reliable" : "Not Reliable"}
            </div>
            <p className="text-xs text-muted-foreground">Performance status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
