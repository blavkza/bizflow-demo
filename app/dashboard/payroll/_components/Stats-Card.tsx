"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Users } from "lucide-react";
import { Employee } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { useEffect, useState } from "react";

interface Payment {
  amount: Decimal;
  payDate: Date;
}

interface DepartmentManager {
  name: string;
}

interface Department {
  id: string;
  name: string;
  manager: DepartmentManager | null;
}

interface EmployeeWithDetails extends Employee {
  department: Department | null;
  payments: Payment[];
}

interface HRSettings {
  paymentDay: number;
  paymentMonth: "CURRENT" | "FOLLOWING";
}

interface StatsCardProps {
  employees?: EmployeeWithDetails[];
}

export default function StatsCard({ employees = [] }: StatsCardProps) {
  const [hrSettings, setHrSettings] = useState<HRSettings | null>(null);
  const [nextPayDate, setNextPayDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const totalPayroll = employees.reduce(
    (sum, employee) =>
      employee?.status === "ACTIVE" ? sum + Number(employee?.salary || 0) : sum,
    0
  );

  const activeWorkers = employees.filter(
    (employee) => employee?.status === "ACTIVE"
  ).length;

  // Fetch HR settings and calculate next pay date
  useEffect(() => {
    const fetchHRSettings = async () => {
      try {
        const response = await fetch("/api/settings/hr");
        if (response.ok) {
          const data = await response.json();
          setHrSettings(data);

          // Calculate next pay date
          const calculatedPayDate = calculateNextPayDate(data);
          setNextPayDate(calculatedPayDate);

          // Calculate days remaining
          if (calculatedPayDate) {
            const today = new Date();
            const timeDiff = calculatedPayDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setDaysRemaining(daysDiff);
          }
        }
      } catch (error) {
        console.error("Failed to fetch HR settings:", error);
      }
    };

    fetchHRSettings();
  }, []);

  // Function to calculate next pay date
  const calculateNextPayDate = (settings: HRSettings): Date | null => {
    if (!settings) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let payDate: Date;

    if (settings.paymentMonth === "CURRENT") {
      // Payday is in the current month
      payDate = new Date(currentYear, currentMonth, settings.paymentDay);

      // If payday has already passed this month, move to next month
      if (payDate < today) {
        payDate = new Date(currentYear, currentMonth + 1, settings.paymentDay);
      }
    } else {
      // FOLLOWING month - payday is in next month
      payDate = new Date(currentYear, currentMonth + 1, settings.paymentDay);
    }

    return payDate;
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return "Not scheduled";

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get days remaining text
  const getDaysRemainingText = (days: number | null): string => {
    if (days === null) return "N/A days remaining";
    if (days === 0) return "Payday is today!";
    if (days === 1) return "1 day remaining";
    if (days < 0) return "Payday passed";
    return `${days} days remaining`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employees.length}</div>
          <p className="text-xs text-muted-foreground">
            {activeWorkers} active workers
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{totalPayroll.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total expenses for{" "}
            <span className="text-green-500 font-bold">ACTIVE</span> employees
            per Day
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Payroll</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDate(nextPayDate)}</div>
          <p className="text-xs text-muted-foreground">
            {getDaysRemainingText(daysRemaining)}
            {hrSettings && (
              <span className="block text-xs text-blue-500 mt-1">
                Payday: {hrSettings.paymentDay} of{" "}
                {hrSettings.paymentMonth.toLowerCase()} month
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
