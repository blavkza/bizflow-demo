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
import { useState } from "react";
import { PaymentType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeWithDetails } from "@/types/payroll";

const PayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
});

type PayrollFormValues = z.infer<typeof PayrollSchema>;

type PayrollEmployeeData = {
  id: string;
  amount: number;
  daysWorked: number;
  departmentId?: string;
};

type PayrollData = {
  description?: string;
  type: PaymentType;
  employees: PayrollEmployeeData[];
  totalAmount: number;
};

interface PayrollFormProps {
  employees: EmployeeWithDetails[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function PayrollForm({
  employees,
  onCancel,
  onSubmitSuccess,
}: PayrollFormProps) {
  const [employeeDays, setEmployeeDays] = useState<Record<string, number>>({});
  const [totalPayroll, setTotalPayroll] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(PayrollSchema),
    defaultValues: {
      description: "",
      type: PaymentType.SALARY,
    },
  });

  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");

  const handleDaysChange = (employeeId: string, days: number) => {
    const newDays = Math.max(0, Math.min(31, days));
    setEmployeeDays((prev) => ({
      ...prev,
      [employeeId]: newDays,
    }));
    calculateTotalPayroll({
      ...employeeDays,
      [employeeId]: newDays,
    });
  };

  const calculateTotalPayroll = (daysData: Record<string, number>) => {
    setIsCalculating(true);
    let total = 0;

    activeEmployees.forEach((employee) => {
      const daysWorked = daysData[employee.id] || 0;
      const salaryAsNumber = Number(employee.salary);
      const dailyRate = salaryAsNumber;
      total += dailyRate * daysWorked;
    });

    setTotalPayroll(parseFloat(total.toFixed(2)));
    setIsCalculating(false);
  };

  const allEmployeesHaveDays = activeEmployees.every(
    (emp) => (employeeDays[emp.id] || 0) > 0
  );

  const onSubmit = async (values: PayrollFormValues) => {
    try {
      const payrollData: PayrollData = {
        ...values,
        employees: activeEmployees.map((employee) => {
          const daysWorked = employeeDays[employee.id] || 0;
          const amount = parseFloat(
            (Number(employee.salary) * daysWorked).toFixed(2)
          );

          return {
            id: employee.id,
            amount: amount,
            daysWorked,
            departmentId: employee.department?.id,
          };
        }),
        totalAmount: totalPayroll,
      };

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payrollData),
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder=" (e.g) June 2024 Payroll" />
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
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.values(PaymentType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Employees</h3>
          <div className="space-y-4">
            {activeEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {employee.department?.name || "No department"} - Salary: R
                    {Number(employee.salary).toLocaleString()}
                  </p>
                </div>
                <div className="w-full sm:w-32">
                  <label className="mb-1 block text-sm font-medium">
                    Days Worked
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={employeeDays[employee.id] || ""}
                    onChange={(e) =>
                      handleDaysChange(employee.id, Number(e.target.value))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="font-medium">
            Total Payroll:{" "}
            <span className="font-bold">R{totalPayroll.toFixed(2)}</span>
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!allEmployeesHaveDays || isCalculating}
          >
            {(form.formState.isSubmitting || isCalculating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Process Payroll
          </Button>
        </div>
      </form>
    </Form>
  );
}
