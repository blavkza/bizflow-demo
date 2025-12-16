"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { PaymentType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { WorkerWithDetails, PayrollCalculationData } from "@/types/payroll";
import { PayrollAlerts } from "./PayrollAlerts";
import { HRSettingsCard } from "./HRSettingsCard";
import { PayrollFormFields } from "./PayrollFormFields";
import { PayrollLoadingState } from "./PayrollLoadingState";
import { PayrollNoDataState } from "./PayrollNoDataState";
import { PayrollDataTabs } from "./PayrollDataTabs";
import { PayrollSummary } from "./PayrollSummary";
import { PayrollActions } from "./PayrollActions";
import { WorkerTypeFilter } from "./WorkerTypeFilter";
import { PayrollReviewTable } from "./PayrollReviewTable";

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

export default function PayrollForm({
  employees,
  onCancel,
  onSubmitSuccess,
}: PayrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculationData[]>([]);

  // NEW: Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set()
  );

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

      // Default: Select all employees when data loads
      setSelectedEmployeeIds(new Set(data.map((emp) => emp.id)));
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast.error("Failed to load payroll data");
      setPayrollData([]);
      setSelectedEmployeeIds(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handler for updating a single employee from the Edit Dialog
  const handleUpdateEmployee = (updatedEmp: PayrollCalculationData) => {
    setPayrollData((prev) =>
      prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
    );
  };

  // NEW: Toggle handlers
  const handleToggleSelection = (id: string, checked: boolean) => {
    const next = new Set(selectedEmployeeIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedEmployeeIds(next);
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(new Set(payrollData.map((d) => d.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  // Filter data for summary calculations based on selection
  const selectedPayrollData = useMemo(() => {
    return payrollData.filter((emp) => selectedEmployeeIds.has(emp.id));
  }, [payrollData, selectedEmployeeIds]);

  // Calculate totals dynamically based on selected/edited data
  const totals = useMemo(() => {
    return selectedPayrollData.reduce(
      (acc, curr) => ({
        baseAmount: acc.baseAmount + (curr.baseAmount || 0),
        overtimeAmount: acc.overtimeAmount + (curr.overtimeAmount || 0),
        bonusAmount: acc.bonusAmount + (curr.bonusAmount || 0),
        deductionAmount: acc.deductionAmount + (curr.deductionAmount || 0),
        totalPayroll: acc.totalPayroll + (curr.amount || 0), // Gross
        netPayroll: acc.netPayroll + (curr.netAmount || curr.amount || 0),
        paidDays: acc.paidDays + (curr.paidDays || 0),
        regularHours: acc.regularHours + (curr.regularHours || 0),
        overtimeHours: acc.overtimeHours + (curr.overtimeHours || 0),
      }),
      {
        baseAmount: 0,
        overtimeAmount: 0,
        bonusAmount: 0,
        deductionAmount: 0,
        totalPayroll: 0,
        netPayroll: 0,
        paidDays: 0,
        regularHours: 0,
        overtimeHours: 0,
      }
    );
  }, [selectedPayrollData]);

  const onSubmit = async (values: PayrollFormValues) => {
    // 1. Validation: Must have selected employees
    if (selectedPayrollData.length === 0) {
      toast.error("Please select at least one employee to process.");
      return;
    }

    const canProcess = payrollRestriction?.canProcess;
    if (!canProcess) {
      toast.error("Cannot process payroll at this time (Restriction active).");
      return;
    }

    setIsLoading(true);
    try {
      // 2. Prepare submission data using ONLY selected and updated data
      const submissionData: any[] = selectedPayrollData.map((emp) => ({
        id: emp.id,
        amount: emp.amount || 0, // Gross
        netAmount: emp.netAmount || emp.amount || 0,
        baseAmount: emp.baseAmount || 0,
        overtimeAmount: emp.overtimeAmount || 0,
        bonusAmount: emp.bonusAmount || 0,
        deductionAmount: emp.deductionAmount || 0,
        daysWorked: emp.paidDays || 0,
        overtimeHours: emp.overtimeHours || 0,
        regularHours: emp.regularHours || 0,
        description: `Salary for ${values.month} - ${emp.paidDays} days worked`,
        departmentId: emp.department?.id,
        isFreelancer: emp.isFreelancer,
        // Important: Send the edited arrays
        bonuses: emp.bonuses || [],
        deductions: emp.deductions || [],
      }));

      const payrollDataToSubmit: any = {
        ...values,
        employees: submissionData,
        totalAmount: parseFloat(totals.totalPayroll.toFixed(2)),
        netAmount: parseFloat(totals.netPayroll.toFixed(2)),
        totalBonuses: parseFloat(totals.bonusAmount.toFixed(2)),
        totalDeductions: parseFloat(totals.deductionAmount.toFixed(2)),
      };

      console.log("Submitting payroll:", payrollDataToSubmit);

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

      toast.success("Payroll processed successfully!");
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll");
      console.error("Payroll submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProcessPayroll = Boolean(
    selectedPayrollData.length > 0 &&
      selectedMonth &&
      totals.totalPayroll > 0 &&
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
              {/* NEW: Review Table Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Review & Select Employees
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select employees to include in this run. Click the edit icon
                  to toggle specific bonuses or deductions.
                </p>

                <PayrollReviewTable
                  employees={payrollData}
                  selectedIds={selectedEmployeeIds}
                  onToggleSelection={handleToggleSelection}
                  onToggleAll={handleToggleAll}
                  onUpdateEmployee={handleUpdateEmployee}
                />

                <div className="flex justify-end p-2 bg-muted/30 rounded-md">
                  <span className="text-sm font-medium">
                    Selected: {selectedEmployeeIds.size} / {payrollData.length}{" "}
                    employees
                  </span>
                </div>
              </div>

              {/* Summary Section (Now uses dynamic totals based on selection) */}
              <PayrollSummary
                payrollData={selectedPayrollData} // Pass selected data only
                totalBaseAmount={totals.baseAmount}
                totalOvertimeAmount={totals.overtimeAmount}
                totalBonusAmount={totals.bonusAmount}
                totalDeductionAmount={totals.deductionAmount}
                totalPayroll={totals.totalPayroll}
                netPayroll={totals.netPayroll}
                totalPaidDays={totals.paidDays}
                totalRegularHours={totals.regularHours}
                totalOvertimeHours={totals.overtimeHours}
                workerType={
                  selectedWorkerType as "all" | "employees" | "freelancers"
                }
              />

              {/* Detailed Breakdown Tabs */}
              <PayrollDataTabs
                payrollData={selectedPayrollData} // Pass selected data only
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalBaseAmount={totals.baseAmount}
                totalOvertimeAmount={totals.overtimeAmount}
                totalBonusAmount={totals.bonusAmount}
                totalDeductionAmount={totals.deductionAmount}
                totalPayroll={totals.totalPayroll}
                netPayroll={totals.netPayroll}
                totalPaidDays={totals.paidDays}
                totalRegularHours={totals.regularHours}
                totalOvertimeHours={totals.overtimeHours}
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
              setSelectedEmployeeIds(new Set());
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
