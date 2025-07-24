"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@prisma/client";

import { Mail, Phone, MapPin, DollarSign, TrendingUp } from "lucide-react";

interface StatsProps {
  employee: Employee & {
    department?: {
      id: string;
      name: string;
      manager?: {
        name: string;
      } | null;
    } | null;
    payments?: {
      id: string;
      amount: number;
      payDate: Date;
      type: string;
      status: string;
      description?: string | null;
    }[];
  };
}

export default function Stats({ employee }: StatsProps) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {[employee.address, employee.city].filter(Boolean).join(", ")}
              </span>{" "}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Department:</span>
              <span className="text-sm font-medium">
                {employee.department?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Hire Date:</span>
              <span className="text-sm font-medium">
                {new Date(employee.hireDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>{" "}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Monthly Salary:
              </span>
              <span className="text-sm font-medium">
                R{employee.salary.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-lg font-bold">
                    {employee.payments && employee.payments.length > 0
                      ? `R${employee.payments
                          .reduce((sum, payment) => sum + payment.amount, 0)
                          .toLocaleString()}`
                      : "R0"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Paid ({employee.payments?.length || 0} payments)
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">
                  {employee.payments?.length || 0} payments
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Payments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
