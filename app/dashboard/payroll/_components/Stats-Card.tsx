"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Calendar,
  Users,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { useEffect, useState } from "react";
import { WorkerWithDetails } from "@/types/payroll"; // Import from your types file

interface HRSettings {
  paymentDay: number;
  paymentMonth: "CURRENT" | "FOLLOWING";
}

interface StatsCardProps {
  employees?: WorkerWithDetails[]; // Use the imported type
}

// Type guard functions
function isFreelancer(
  worker: WorkerWithDetails
): worker is WorkerWithDetails & { isFreelancer: true } {
  return worker.isFreelancer === true;
}

function isEmployee(
  worker: WorkerWithDetails
): worker is WorkerWithDetails & { isFreelancer: false } {
  return !worker.isFreelancer;
}

export default function StatsCard({ employees = [] }: StatsCardProps) {
  const [hrSettings, setHrSettings] = useState<HRSettings | null>(null);
  const [nextPayDate, setNextPayDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const activeWorkers = employees.filter(
    (worker) => worker?.status === "ACTIVE"
  );

  const activeEmployees = activeWorkers.filter(isEmployee);
  const activeFreelancers = activeWorkers.filter(isFreelancer);

  const totalWorkers = employees.length;
  const totalActiveWorkers = activeWorkers.length;

  const employeesOnly = employees.filter(isEmployee);
  const freelancersOnly = employees.filter(isFreelancer);

  const calculateEmployeePayroll = (
    employee: WorkerWithDetails & { isFreelancer: false }
  ): number => {
    // Use type assertion to access the properties safely
    const emp = employee as any;

    if (employee.salaryType === "DAILY") {
      return Number(emp.dailySalary || emp.salary || 0);
    } else {
      return Number(emp.monthlySalary || emp.salary || 0) / 22;
    }
  };

  const calculateFreelancerPayroll = (
    freelancer: WorkerWithDetails & { isFreelancer: true }
  ): number => {
    // Freelancers always use daily rate from salary field
    const free = freelancer as any;
    return Number(free.salary || 0);
  };

  const totalEmployeePayroll = activeEmployees.reduce(
    (sum, employee) => sum + calculateEmployeePayroll(employee),
    0
  );

  const totalFreelancerPayroll = activeFreelancers.reduce(
    (sum, freelancer) => sum + calculateFreelancerPayroll(freelancer),
    0
  );

  const totalPayroll = totalEmployeePayroll + totalFreelancerPayroll;

  // Calculate salary type breakdown
  const dailyEmployees = activeEmployees.filter(
    (emp) => emp.salaryType === "DAILY"
  ).length;
  const monthlyEmployees = activeEmployees.filter(
    (emp) => emp.salaryType === "MONTHLY"
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

  // Format currency
  const formatCurrency = (value: number): string => {
    return `R${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total Workers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWorkers}</div>
          <p className="text-xs text-muted-foreground">
            {totalActiveWorkers} active workers
          </p>
          <p className="text-xs text-blue-500 mt-1">
            {employeesOnly.length} emp + {freelancersOnly.length} free
          </p>
        </CardContent>
      </Card>

      {/* Employees Payroll Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Employees Daily</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalEmployeePayroll)}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeEmployees.length} active employees
          </p>
          <p className="text-xs text-blue-500 mt-1">
            {dailyEmployees} daily + {monthlyEmployees} monthly
          </p>
        </CardContent>
      </Card>

      {/* Freelancers Payroll Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Freelancers Daily
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalFreelancerPayroll)}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeFreelancers.length} active freelancers
          </p>
          <p className="text-xs text-green-500 mt-1">All daily rate</p>
        </CardContent>
      </Card>

      {/* Total Daily Payroll Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Daily</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalPayroll)}
          </div>
          <p className="text-xs text-muted-foreground">
            Combined daily payroll
          </p>
          <p className="text-xs text-purple-500 mt-1">
            Emp: {formatCurrency(totalEmployeePayroll)} + Free:{" "}
            {formatCurrency(totalFreelancerPayroll)}
          </p>
        </CardContent>
      </Card>

      {/* Next Payroll Card */}
      <Card className="md:col-span-4">
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
