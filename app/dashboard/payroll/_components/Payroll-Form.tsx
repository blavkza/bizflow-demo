"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { PaymentType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmployeeWithDetails,
  PayrollCalculationData,
  PayrollData,
  PayrollSubmissionData,
} from "@/types/payroll";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

type PayrollFormValues = z.infer<typeof PayrollSchema>;

interface PayrollFormProps {
  employees: EmployeeWithDetails[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

// Generate month options (last 12 months)
const generateMonthOptions = () => {
  const months = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push({
      value: `${year}-${month}`,
      label: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      }),
    });
  }

  return months;
};

// Safe number formatting function
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "R0.00";
  }
  return `R${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Safe number display function
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return value.toString();
};

export default function PayrollForm({
  employees,
  onCancel,
  onSubmitSuccess,
}: PayrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculationData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(PayrollSchema),
    defaultValues: {
      description: "",
      type: PaymentType.SALARY,
      month: "",
    },
  });

  const monthOptions = generateMonthOptions();

  // Load payroll data when month changes
  useEffect(() => {
    const month = form.watch("month");
    if (month) {
      loadPayrollData(month);
    }
  }, [form.watch("month")]);

  const loadPayrollData = async (month: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading payroll data for month: ${month}`);
      const response = await fetch(`/api/payroll/calculate?month=${month}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load payroll data");
      }

      const data = await response.json();
      console.log("Payroll data loaded:", data);

      // Validate and clean the data
      const validatedData = data.map((employee: any) => ({
        id: employee.id || "",
        firstName: employee.firstName || "Unknown",
        lastName: employee.lastName || "Employee",
        amount: Number(employee.calculatedAmount) || 0,
        paidDays: Number(employee.paidDays) || 0,
        dailyRate: Number(employee.dailyRate) || 0,
        monthlySalary: Number(employee.monthlySalary) || 0,
        department: employee.department || undefined,
        attendanceBreakdown: {
          presentDays: Number(employee.attendanceBreakdown?.presentDays) || 0,
          halfDays: Number(employee.attendanceBreakdown?.halfDays) || 0,
          leaveDays: Number(employee.attendanceBreakdown?.leaveDays) || 0,
          absentDays: Number(employee.attendanceBreakdown?.absentDays) || 0,
          unpaidLeaveDays:
            Number(employee.attendanceBreakdown?.unpaidLeaveDays) || 0,
          totalDays: Number(employee.attendanceBreakdown?.totalDays) || 0,
        },
      }));

      setPayrollData(validatedData);
      setSelectedMonth(month);
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPayroll = payrollData.reduce(
    (sum, employee) => sum + (employee.amount || 0),
    0
  );

  const allEmployeesHaveData = payrollData.length > 0;

  const onSubmit = async (values: PayrollFormValues) => {
    try {
      // Transform the data for submission
      const submissionData: PayrollSubmissionData[] = payrollData.map(
        (emp) => ({
          id: emp.id,
          amount: emp.amount || 0,
          daysWorked: emp.paidDays || 0,
          departmentId: emp.department?.id,
        })
      );

      const payrollDataToSubmit: PayrollData = {
        ...values,
        employees: submissionData,
        totalAmount: parseFloat(totalPayroll.toFixed(2)),
      };

      console.log("Submitting payroll:", payrollDataToSubmit);

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payrollDataToSubmit),
      });

      if (!response.ok) throw new Error("Failed to process payroll");

      toast.success("Payroll processed successfully!");
      onSubmitSuccess?.();
    } catch (error) {
      toast.error("Failed to process payroll");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payroll Month *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. June 2024 Payroll" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PaymentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading payroll data...</span>
          </div>
        )}

        {!isLoading && selectedMonth && payrollData.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No attendance records found for{" "}
                {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
                .
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure attendance records exist for the selected month.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && selectedMonth && payrollData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Payroll for{" "}
                {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <Badge variant="secondary">
                Total: {formatCurrency(totalPayroll)}
              </Badge>
            </div>

            <div className="space-y-4">
              {payrollData.map((employee) => {
                const attendance = employee.attendanceBreakdown;

                return (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {employee.department?.name || "No department"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Daily Rate:{" "}
                                {formatCurrency(employee.dailyRate)}{" "}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {formatCurrency(employee.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatNumber(employee.paidDays)} paid days
                              </p>
                            </div>
                          </div>

                          {/* Attendance Summary */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span>Present:</span>
                              <Badge variant="outline" className="bg-green-50">
                                {formatNumber(attendance.presentDays)}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Half Days:</span>
                              <Badge variant="outline" className="bg-yellow-50">
                                {formatNumber(attendance.halfDays)}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Leave:</span>
                              <Badge variant="outline" className="bg-blue-50">
                                {formatNumber(attendance.leaveDays)}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Absent:</span>
                              <Badge variant="outline" className="bg-red-50">
                                {formatNumber(attendance.absentDays)}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Unpaid Leave:</span>
                              <Badge variant="outline" className="bg-gray-50">
                                {formatNumber(attendance.unpaidLeaveDays)}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Records:</span>
                              <Badge variant="outline">
                                {formatNumber(attendance.totalDays)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && selectedMonth && payrollData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(payrollData.length)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Paid Days
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      payrollData.reduce(
                        (sum, emp) => sum + (emp.paidDays || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalPayroll)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setPayrollData([]);
              setSelectedMonth("");
              onCancel?.();
            }}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !allEmployeesHaveData ||
              form.formState.isSubmitting ||
              !selectedMonth ||
              totalPayroll <= 0
            }
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Process Payroll
          </Button>
        </div>
      </form>
    </Form>
  );
}
