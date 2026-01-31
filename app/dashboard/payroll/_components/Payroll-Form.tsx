"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { PaymentType } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";

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
import { DepartmentFilter } from "./DepartmentFilter";

const PayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  workerType: z.enum(["all", "employees", "freelancers"]).default("all"),
  departments: z.array(z.string()).default([]),
});

type PayrollFormValues = z.infer<typeof PayrollSchema>;

interface Department {
  id: string;
  name: string;
}

interface PayrollFormProps {
  employees: WorkerWithDetails[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
  initialPayroll?: any; // Add this
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
  initialPayroll,
}: PayrollFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allPayrollData, setAllPayrollData] = useState<
    PayrollCalculationData[]
  >([]); // All data from API
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(initialPayroll?.id || null);

  // Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set()
  );

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("all");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
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
      description: initialPayroll?.description || "",
      type: initialPayroll?.type || PaymentType.SALARY,
      month: initialPayroll?.month || currentMonth,
      workerType: initialPayroll?.workerType || "all",
      departments: initialPayroll?.departments || [],
    },
  });

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await axios.get("/api/departments");
        const departmentsData: Department[] = response.data || [];
        setDepartments(departmentsData);

        console.log("Departments loaded:", departmentsData);
      } catch (err) {
        console.error("Error fetching departments:", err);
        toast.error("Failed to load departments");
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

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
      setSelectedDepartments([]);
      checkPayrollRestrictions(currentMonth);
      loadPayrollData(currentMonth, "all", []); // Load ALL data without filters
    };

    initializeData();
  }, [currentMonth, initialPayroll]);

  useEffect(() => {
    const month = formMethods.watch("month");
    const workerType = formMethods.watch("workerType");
    const departments = formMethods.watch("departments");

    if (
      month &&
      (month !== selectedMonth ||
        workerType !== selectedWorkerType ||
        JSON.stringify(departments) !== JSON.stringify(selectedDepartments))
    ) {
      console.log("Filters changed:", { month, workerType, departments });
      setSelectedMonth(month);
      setSelectedWorkerType(workerType);
      setSelectedDepartments(departments);
      checkPayrollRestrictions(month);
      loadPayrollData(month, workerType, departments); // Pass watched values directly
    }
  }, [
    formMethods.watch("month"),
    formMethods.watch("workerType"),
    formMethods.watch("departments"),
  ]);

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

  const loadPayrollData = async (
    month: string,
    workerType: string,
    selectedDepts: string[]
  ) => {
    setIsLoading(true);
    try {
      // 1. Check if there's an existing draft for this month
      // Start fresh for this month
      let currentDraft = null;

      if (initialPayroll && initialPayroll.month === month) {
        currentDraft = initialPayroll;
      } else {
        const draftRes = await fetch(`/api/payroll/draft?month=${month}`);
        if (draftRes.ok) {
          const draftData = await draftRes.json();
          if (draftData) {
            currentDraft = draftData;
            setLoadedDraftId(draftData.id);
            // Update form fields with draft data
            formMethods.setValue("description", draftData.description || "");
            formMethods.setValue("type", draftData.type);
            toast.info(`Loaded saved draft for ${month}`);
          } else {
            setLoadedDraftId(null);
          }
        }
      }

      // 2. Fetch calculations
      const response = await fetch(
        `/api/payroll/calculate?month=${month}&workerType=${workerType}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch payroll calculations");
      }

      const data: PayrollCalculationData[] = await response.json();
      console.log("All payroll data loaded:", data.length, "records");

      // Merge with draft if available
      let finalData = data;
      if (currentDraft?.payments) {
        finalData = data.map(emp => {
          const draftPayment = currentDraft.payments.find((p: any) => 
            (p.employeeId === emp.id) || (p.freeLancerId === emp.id)
          );
          
          if (draftPayment) {
            return {
              ...emp,
              amount: Number(draftPayment.amount),
              netAmount: Number(draftPayment.netAmount),
              baseAmount: Number(draftPayment.baseAmount),
              overtimeAmount: Number(draftPayment.overtimeAmount),
              bonusAmount: Number(draftPayment.bonusAmount),
              deductionAmount: Number(draftPayment.deductionAmount),
              paidDays: draftPayment.daysWorked,
              overtimeHours: Number(draftPayment.overtimeHours),
              regularHours: Number(draftPayment.regularHours),
              bonuses: draftPayment.paymentBonuses?.map((b: any) => ({
                type: b.bonusType,
                amount: Number(b.amount),
                description: b.description
              })) || [],
              deductions: draftPayment.paymentDeductions?.map((d: any) => ({
                type: d.deductionType,
                amount: Number(d.amount),
                description: d.description
              })) || []
            };
          }
          return emp;
        });
      }

      setAllPayrollData(finalData);

      // Default: Select all filtered employees when data loads
      const filteredData = applyFilters(
        finalData,
        selectedWorkerType,
        selectedDepartments
      );
      
      // If draft, only select those who were in the draft
      if (currentDraft?.payments) {
        const draftIds = new Set(currentDraft.payments.map((p: any) => p.employeeId || p.freeLancerId));
        setSelectedEmployeeIds(new Set(filteredData.filter(emp => draftIds.has(emp.id)).map(emp => emp.id)));
      } else {
        setSelectedEmployeeIds(new Set(filteredData.map((emp) => emp.id)));
      }
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast.error("Failed to load payroll data");
      setAllPayrollData([]);
      setSelectedEmployeeIds(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters on the frontend
  const applyFilters = (
    data: PayrollCalculationData[],
    workerType: string,
    departments: string[]
  ): PayrollCalculationData[] => {
    let filtered = [...data];

    // Filter by worker type
    if (workerType !== "all") {
      filtered = filtered.filter((emp) => {
        if (workerType === "employees") {
          return !emp.isFreelancer;
        } else if (workerType === "freelancers") {
          return emp.isFreelancer;
        }
        return true;
      });
    }

    // Filter by departments
    if (departments && departments.length > 0) {
      filtered = filtered.filter((emp) => {
        // If employee has no department, include them? You can change this logic
        if (!emp.department?.id) return false;

        return departments.includes(emp.department.id);
      });
    }

    console.log("Frontend filtering results:", {
      total: data.length,
      filtered: filtered.length,
      workerType,
      departments,
    });

    return filtered;
  };

  // Apply filters to get display data
  const filteredPayrollData = useMemo(() => {
    return applyFilters(
      allPayrollData,
      selectedWorkerType,
      selectedDepartments
    );
  }, [allPayrollData, selectedWorkerType, selectedDepartments]);

  // Handler for updating a single employee from the Edit Dialog
  const handleUpdateEmployee = (updatedEmp: PayrollCalculationData) => {
    setAllPayrollData((prev) =>
      prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
    );
  };

  // Toggle handlers
  const handleToggleSelection = (id: string, checked: boolean) => {
    const next = new Set(selectedEmployeeIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedEmployeeIds(next);
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(new Set(filteredPayrollData.map((d) => d.id)));
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  // Filter data for summary calculations based on selection
  const selectedPayrollData = useMemo(() => {
    return filteredPayrollData.filter((emp) => selectedEmployeeIds.has(emp.id));
  }, [filteredPayrollData, selectedEmployeeIds]);

  // Calculate totals dynamically based on selected/edited data
  const totals = useMemo(() => {
    return selectedPayrollData.reduce(
      (acc, curr) => ({
        baseAmount: acc.baseAmount + (curr.baseAmount || 0),
        overtimeAmount: acc.overtimeAmount + (curr.overtimeAmount || 0),
        bonusAmount: acc.bonusAmount + (curr.bonusAmount || 0),
        deductionAmount: acc.deductionAmount + (curr.deductionAmount || 0),
        totalPayroll: acc.totalPayroll + (curr.amount || 0),
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

  const handlePayrollSubmission = async (values: PayrollFormValues, status: string = "PROCESSED") => {
    if (selectedPayrollData.length === 0) {
      toast.error("Please select at least one employee to process.");
      return;
    }

    const isDraft = status === "DRAFT";
    const canProcess = isDraft ? true : payrollRestriction?.canProcess;
    
    if (!canProcess) {
      toast.error("Cannot process payroll at this time (Restriction active).");
      return;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsLoading(true);
    }
    try {
      const submissionData: any[] = selectedPayrollData.map((emp) => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        salaryType: emp.salaryType,
        monthlySalary: emp.monthlySalary,
        dailySalary: emp.dailySalary,
        overtimeHourRate: emp.overtimeHourRate,
        department: emp.department,
        paidDays: emp.paidDays,
        baseAmount: emp.baseAmount,
        overtimeHours: emp.overtimeHours,
        overtimeAmount: emp.overtimeAmount,
        bonusAmount: emp.bonusAmount,
        deductionAmount: emp.deductionAmount,
        amount: emp.amount,
        netAmount: emp.netAmount,
        regularHours: emp.regularHours,
        isFreelancer: emp.isFreelancer,
        bonuses: emp.bonuses,
        deductions: emp.deductions,
        performanceScore: emp.performanceScore,
      }));

      const payrollDataToSubmit: any = {
        ...values,
        employees: submissionData,
        status,
        payrollId: loadedDraftId || initialPayroll?.id,
        totalAmount: parseFloat(totals.totalPayroll.toFixed(2)),
        netAmount: parseFloat(totals.netPayroll.toFixed(2)),
        totalBonuses: parseFloat(totals.bonusAmount.toFixed(2)),
        totalDeductions: parseFloat(totals.deductionAmount.toFixed(2)),
      };

      console.log("Submitting payroll data:", payrollDataToSubmit);

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payrollDataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isDraft ? "save draft" : "process payroll"}`);
      }

      toast.success(isDraft ? "Payroll draft saved!" : "Payroll processed successfully!");
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isDraft ? "save draft" : "process payroll"}`);
      console.error("Payroll submission error:", error);
    } finally {
      setIsLoading(false);
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (values: PayrollFormValues) => {
    await handlePayrollSubmission(values, "PROCESSED");
  };

  const handleSaveDraft = async () => {
    const values = formMethods.getValues();
    await handlePayrollSubmission(values, "DRAFT");
  };

  const canProcessPayroll = Boolean(
    selectedPayrollData.length > 0 &&
      selectedMonth &&
      totals.totalPayroll > 0 &&
      payrollRestriction?.canProcess
  );

  // Update selected employees when filtered data changes
  useEffect(() => {
    // Keep only valid selections (employees that are still in filtered data)
    const validIds = new Set(filteredPayrollData.map((emp) => emp.id));
    const currentIds = Array.from(selectedEmployeeIds);
    const newSelectedIds = currentIds.filter((id) => validIds.has(id));

    if (newSelectedIds.length !== selectedEmployeeIds.size) {
      setSelectedEmployeeIds(new Set(newSelectedIds));
    }
  }, [filteredPayrollData]);

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

          {/* Department Filter Component */}
          {departments.length > 0 && (
            <DepartmentFilter
              form={formMethods}
              departments={departments}
              isLoading={isLoadingDepartments}
            />
          )}

          <PayrollFormFields form={formMethods} />

          {isLoading && <PayrollLoadingState />}

          {!isLoading && selectedMonth && filteredPayrollData.length === 0 && (
            <PayrollNoDataState
              selectedMonth={selectedMonth}
              workerType={selectedWorkerType}
              selectedDepartments={selectedDepartments}
            />
          )}

          {!isLoading && selectedMonth && filteredPayrollData.length > 0 && (
            <>
              {/* Review Table Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Review & Select Employees
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredPayrollData.length} of{" "}
                    {allPayrollData.length} employees
                    {selectedDepartments.length > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        (Filtered by {selectedDepartments.length} department
                        {selectedDepartments.length > 1 ? "s" : ""})
                      </span>
                    )}
                    {selectedWorkerType !== "all" && (
                      <span className="ml-2 text-primary font-medium">
                        ({selectedWorkerType} only)
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select employees to include in this run. Click the edit icon
                  to toggle specific bonuses or deductions.
                </p>

                <PayrollReviewTable
                  employees={filteredPayrollData}
                  selectedIds={selectedEmployeeIds}
                  onToggleSelection={handleToggleSelection}
                  onToggleAll={handleToggleAll}
                  onUpdateEmployee={handleUpdateEmployee}
                />

                <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                  <span className="text-sm font-medium">
                    Selected: {selectedEmployeeIds.size} /{" "}
                    {filteredPayrollData.length} employees
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAll(
                        selectedEmployeeIds.size !== filteredPayrollData.length
                      )
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedEmployeeIds.size === filteredPayrollData.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              {/* Summary Section */}
              <PayrollSummary
                payrollData={selectedPayrollData}
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
                payrollData={selectedPayrollData}
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
              setAllPayrollData([]);
              setSelectedEmployeeIds(new Set());
              setSelectedMonth("");
              setSelectedWorkerType("all");
              setSelectedDepartments([]);
              onCancel?.();
            }}
            isSubmitting={formMethods.formState.isSubmitting}
            canProcess={canProcessPayroll}
            onSaveDraft={handleSaveDraft}
            isSavingDraft={isSavingDraft}
          />
        </form>
      </div>
    </FormProvider>
  );
}
