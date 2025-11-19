// app/workers/_components/Payroll-Form.tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect } from "react";
import { PaymentType, SalaryType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  WorkerWithDetails,
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
import { WorkerTypeFilter } from "./WorkerTypeFilter";

const PayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  workerType: z.enum(["all", "employees", "freelancers"]).default("all"),
});

type PayrollFormValues = z.infer<typeof PayrollSchema>;

interface PayrollFormProps {
  employees: WorkerWithDetails[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getWorkingDaysInMonth = (year: number, month: number): number => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let workingDays = 0;

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
};

export default function PayrollForm({
  employees,
  onCancel,
  onSubmitSuccess,
}: PayrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculationData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("all");
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
      month: currentMonth,
      workerType: "all",
    },
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await fetch("/api/hr/settings");
        if (response.ok) {
          const data = await response.json();
          setHrSettings(data);
        }
      } catch (error) {
        console.error("Failed to load HR settings:", error);
      }

      setSelectedMonth(currentMonth);
      setSelectedWorkerType("all");
      checkPayrollRestrictions(currentMonth);
      loadPayrollData(currentMonth, "all");
    };

    initializeData();
  }, [currentMonth]);

  useEffect(() => {
    const month = formMethods.watch("month");
    const workerType = formMethods.watch("workerType");

    if (
      month &&
      (month !== selectedMonth || workerType !== selectedWorkerType)
    ) {
      setSelectedMonth(month);
      setSelectedWorkerType(workerType);
      checkPayrollRestrictions(month);
      loadPayrollData(month, workerType);
    }
  }, [formMethods.watch("month"), formMethods.watch("workerType")]);

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

  const loadPayrollData = async (month: string, workerType: string) => {
    setIsLoading(true);
    try {
      console.log(
        `Loading payroll data for month: ${month}, workerType: ${workerType}`
      );
      const response = await fetch(
        `/api/payroll/calculate?month=${month}&workerType=${workerType}`
      );
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
        loadPayrollData(selectedMonth, selectedWorkerType);
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
      const submissionData: any[] = payrollData.map((emp) => ({
        id: emp.id,
        amount: emp.amount || 0,
        baseAmount: emp.baseAmount || 0,
        overtimeAmount: emp.overtimeAmount || 0,
        daysWorked: emp.paidDays || 0,
        overtimeHours: emp.overtimeHours || 0,
        regularHours: emp.regularHours || 0,
        description: `Salary for ${values.month} - ${emp.paidDays} days worked, ${emp.overtimeHours}h overtime`,
        departmentId: emp.department?.id,
        isFreelancer: emp.isFreelancer,
      }));

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
      };

      console.log("Submitting payroll with detailed amounts:", {
        ...payrollDataToSubmit,
        summary: {
          totalWorkers: payrollData.length,
          totalBaseAmount,
          totalOvertimeAmount,
          totalPayroll,
          workerType: values.workerType,
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

          <WorkerTypeFilter form={formMethods} />

          <PayrollFormFields form={formMethods} />

          {isLoading && <PayrollLoadingState />}

          {!isLoading && selectedMonth && payrollData.length === 0 && (
            <PayrollNoDataState
              selectedMonth={selectedMonth}
              workerType={selectedWorkerType}
            />
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
                workerType={
                  selectedWorkerType as "all" | "employees" | "freelancers"
                }
              />

              <PayrollSummary
                payrollData={payrollData}
                totalBaseAmount={totalBaseAmount}
                totalOvertimeAmount={totalOvertimeAmount}
                totalPayroll={totalPayroll}
                totalPaidDays={totalPaidDays}
                totalRegularHours={totalRegularHours}
                totalOvertimeHours={totalOvertimeHours}
                workerType={
                  selectedWorkerType as "all" | "employees" | "freelancers"
                }
              />
            </>
          )}

          <PayrollActions
            onCancel={() => {
              formMethods.reset();
              setPayrollData([]);
              setSelectedMonth("");
              setSelectedWorkerType("all");
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
