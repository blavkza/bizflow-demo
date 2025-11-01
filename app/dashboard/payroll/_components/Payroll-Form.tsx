// components/payroll/PayrollForm.tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect } from "react";
import { PaymentType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  EmployeeWithDetails,
  PayrollData,
  PayrollSubmissionData,
  PayrollCalculationData,
} from "@/types/payroll";
import { PayrollHeader } from "./PayrollHeader";
import { PayrollAlerts } from "./PayrollAlerts";
import { HRSettingsCard } from "./HRSettingsCard";
import { PayrollFormFields } from "./PayrollFormFields";
import { PayrollLoadingState } from "./PayrollLoadingState";
import { PayrollNoDataState } from "./PayrollNoDataState";
import { PayrollDataTabs } from "./PayrollDataTabs";
import { PayrollSummary } from "./PayrollSummary";
import { PayrollActions } from "./PayrollActions";

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

// Function to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function PayrollForm({
  employees,
  onCancel,
  onSubmitSuccess,
}: PayrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculationData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [payrollRestriction, setPayrollRestriction] = useState<{
    canProcess: boolean;
    message?: string;
  } | null>(null);
  const [hrSettings, setHrSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const currentMonth = getCurrentMonth();

  const formMethods = useForm<PayrollFormValues>({
    resolver: zodResolver(PayrollSchema),
    defaultValues: {
      description: "",
      type: PaymentType.SALARY,
      month: currentMonth, // Set current month as default
    },
  });

  // Load HR settings and initial payroll data
  useEffect(() => {
    const initializeData = async () => {
      // Load HR settings
      try {
        const response = await fetch("/api/hr/settings");
        if (response.ok) {
          const data = await response.json();
          setHrSettings(data);
        }
      } catch (error) {
        console.error("Failed to load HR settings:", error);
      }

      // Load payroll data for current month
      setSelectedMonth(currentMonth);
      checkPayrollRestrictions(currentMonth);
      loadPayrollData(currentMonth);
    };

    initializeData();
  }, [currentMonth]);

  // Check payroll restrictions when month changes
  useEffect(() => {
    const month = formMethods.watch("month");
    if (month && month !== selectedMonth) {
      setSelectedMonth(month);
      checkPayrollRestrictions(month);
      loadPayrollData(month);
    }
  }, [formMethods.watch("month")]);

  const checkPayrollRestrictions = async (month: string) => {
    try {
      const response = await fetch(`/api/payroll/check?month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setPayrollRestriction(data);
      }
    } catch (error) {
      console.error("Failed to check payroll restrictions:", error);
    }
  };

  const loadPayrollData = async (month: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading payroll data for month: ${month}`);
      const response = await fetch(`/api/payroll/calculate?month=${month}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load payroll data");
      }

      const data: PayrollCalculationData[] = await response.json();
      console.log("Payroll data loaded:", data);
      setPayrollData(data);
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast.error("Failed to load payroll data");
      setPayrollData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processOvertime = async () => {
    try {
      const response = await fetch("/api/attendance/process-overtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: new Date(selectedMonth + "-01"),
          endDate: new Date(
            new Date(selectedMonth + "-01").getFullYear(),
            new Date(selectedMonth + "-01").getMonth() + 1,
            0
          ),
        }),
      });

      if (response.ok) {
        toast.success("Overtime processed successfully!");
        loadPayrollData(selectedMonth);
      } else {
        throw new Error("Failed to process overtime");
      }
    } catch (error) {
      toast.error("Failed to process overtime");
      console.error(error);
    }
  };

  const onSubmit = async (values: PayrollFormValues) => {
    const canProcess = payrollRestriction?.canProcess && payrollData.length > 0;
    if (!canProcess) {
      toast.error("Cannot process payroll at this time");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare submission data with all detailed amounts
      const submissionData: any[] = payrollData.map((emp) => ({
        id: emp.id,
        amount: emp.amount || 0, // Total amount
        baseAmount: emp.baseAmount || 0,
        overtimeAmount: emp.overtimeAmount || 0,
        daysWorked: emp.paidDays || 0,
        overtimeHours: emp.overtimeHours || 0,
        regularHours: emp.regularHours || 0,
        description: `Salary for ${values.month} - ${emp.paidDays} days worked, ${emp.overtimeHours}h overtime`,
        departmentId: emp.department?.id,
      }));

      // Calculate totals
      const totalPayroll = payrollData.reduce(
        (sum, employee) => sum + (employee.amount || 0),
        0
      );
      const totalBaseAmount = payrollData.reduce(
        (sum, employee) => sum + (employee.baseAmount || 0),
        0
      );
      const totalOvertimeAmount = payrollData.reduce(
        (sum, employee) => sum + (employee.overtimeAmount || 0),
        0
      );

      const payrollDataToSubmit: any = {
        ...values,
        employees: submissionData,
        totalAmount: parseFloat(totalPayroll.toFixed(2)),
        // The API will calculate baseAmount and overtimeAmount from individual employee data
      };

      console.log("Submitting payroll with detailed amounts:", {
        ...payrollDataToSubmit,
        summary: {
          totalEmployees: payrollData.length,
          totalBaseAmount,
          totalOvertimeAmount,
          totalPayroll,
        },
      });

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payrollDataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payroll");
      }

      const result = await response.json();
      console.log("Payroll processed successfully:", result);

      toast.success("Payroll processed successfully!");
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll");
      console.error("Payroll submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const employeesWithOvertime = payrollData.filter(
    (emp) => (emp.overtimeAmount || 0) > 0
  );

  // Calculate totals for display
  const totalBaseAmount = payrollData.reduce(
    (sum, employee) => sum + (employee.baseAmount || 0),
    0
  );
  const totalOvertimeAmount = payrollData.reduce(
    (sum, employee) => sum + (employee.overtimeAmount || 0),
    0
  );
  const totalPayroll = payrollData.reduce(
    (sum, employee) => sum + (employee.amount || 0),
    0
  );
  const totalPaidDays = payrollData.reduce(
    (sum, employee) => sum + (employee.paidDays || 0),
    0
  );
  const totalRegularHours = payrollData.reduce(
    (sum, employee) => sum + (employee.regularHours || 0),
    0
  );
  const totalOvertimeHours = payrollData.reduce(
    (sum, employee) => sum + (employee.overtimeHours || 0),
    0
  );

  // Calculate canProcess condition - ensure it returns a boolean
  const canProcessPayroll = Boolean(
    payrollData.length > 0 &&
      selectedMonth &&
      totalPayroll > 0 &&
      payrollRestriction?.canProcess
  );

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <form
          onSubmit={formMethods.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <PayrollAlerts payrollRestriction={payrollRestriction} />

          <HRSettingsCard hrSettings={hrSettings} />

          <PayrollFormFields form={formMethods} />

          {isLoading && <PayrollLoadingState />}

          {!isLoading && selectedMonth && payrollData.length === 0 && (
            <PayrollNoDataState selectedMonth={selectedMonth} />
          )}

          {!isLoading && selectedMonth && payrollData.length > 0 && (
            <>
              <PayrollDataTabs
                payrollData={payrollData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalBaseAmount={totalBaseAmount}
                totalOvertimeAmount={totalOvertimeAmount}
                totalPayroll={totalPayroll}
                totalPaidDays={totalPaidDays}
                totalRegularHours={totalRegularHours}
                totalOvertimeHours={totalOvertimeHours}
              />

              <PayrollSummary
                payrollData={payrollData}
                totalBaseAmount={totalBaseAmount}
                totalOvertimeAmount={totalOvertimeAmount}
                totalPayroll={totalPayroll}
                totalPaidDays={totalPaidDays}
                totalRegularHours={totalRegularHours}
                totalOvertimeHours={totalOvertimeHours}
              />
            </>
          )}

          <PayrollActions
            onCancel={() => {
              formMethods.reset();
              setPayrollData([]);
              setSelectedMonth("");
              onCancel?.();
            }}
            isSubmitting={formMethods.formState.isSubmitting}
            canProcess={canProcessPayroll}
          />
        </form>
      </div>
    </FormProvider>
  );
}
