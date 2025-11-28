import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leaveTypes } from "../types";
import { useToast } from "@/hooks/use-toast";
import { DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info, AlertCircle, CheckCircle2, Calendar } from "lucide-react";

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string | null;
  phone: string;
  position: string;
  department: string;
  avatar: string | null;
  status: string;
  annualLeaveDays: number;
  sickLeaveDays: number;
  studyLeaveDays: number;
  maternityLeaveDays: number;
  paternityLeaveDays: number;
  unpaidLeaveDays: number;
};

type LeaveUsage = {
  usedDays: Record<string, number>;
  remainingDays: Record<string, number>;
  allocation: Record<string, number>;
  currentYear: number;
};

interface LeaveRequestFormProps {
  onSubmit: (data: any) => Promise<boolean> | Promise<void> | void;
  onCancel: () => void;
}

export default function LeaveRequestForm({
  onSubmit,
  onCancel,
}: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    days: "",
    reason: "",
    contactInfo: "",
  });

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [leaveUsage, setLeaveUsage] = useState<LeaveUsage | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const { toast } = useToast();

  // Get current year for display
  const currentYear = new Date().getFullYear();

  // Calculate days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      // Validate that dates are within current year
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      if (startYear !== currentYear || endYear !== currentYear) {
        toast({
          title: "Date Warning",
          description:
            "Leave dates should be within the current year for accurate leave balance calculation.",
          variant: "default",
        });
      }

      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      setCalculatedDays(daysDiff);
      setFormData((prev) => ({ ...prev, days: daysDiff.toString() }));
    }
  }, [formData.startDate, formData.endDate, currentYear, toast]);

  // Update selected employee when employee selection changes
  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(
        (emp) => emp.employeeId === formData.employeeId
      );
      setSelectedEmployee(employee || null);

      // Reset leave type when employee changes
      setFormData((prev) => ({ ...prev, leaveType: "" }));
    } else {
      setSelectedEmployee(null);
      setLeaveUsage(null);
    }
  }, [formData.employeeId, employees]);

  // Fetch leave usage when employee is selected
  useEffect(() => {
    const fetchLeaveUsage = async () => {
      if (!selectedEmployee) {
        setLeaveUsage(null);
        return;
      }

      try {
        setIsLoadingUsage(true);
        const response = await fetch(
          `/api/leaves/employee/${selectedEmployee.employeeId}/used-days`
        );
        if (response.ok) {
          const data = await response.json();
          setLeaveUsage(data);
        } else {
          throw new Error("Failed to fetch leave usage");
        }
      } catch (err) {
        console.error("Error fetching leave usage:", err);
        toast({
          title: "Error",
          description: "Failed to load leave balance",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsage(false);
      }
    };

    fetchLeaveUsage();
  }, [selectedEmployee, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (
      !formData.employeeId ||
      !formData.leaveType ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({
        title: "Validation Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate that dates are within current year
    const startYear = new Date(formData.startDate).getFullYear();
    const endYear = new Date(formData.endDate).getFullYear();

    if (startYear !== currentYear || endYear !== currentYear) {
      toast({
        title: "Validation Error",
        description: `Leave dates must be within the current year (${currentYear}) for accurate leave balance tracking.`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate leave days against allocation
    if (selectedEmployee && formData.leaveType !== "UNPAID" && leaveUsage) {
      const requestedDays = parseInt(formData.days);
      const availableDays = leaveUsage.remainingDays[formData.leaveType] || 0;

      if (requestedDays > availableDays) {
        toast({
          title: "Validation Error",
          description: `Requested days (${requestedDays}) exceed available leave days (${availableDays}) for ${getLeaveTypeLabel(formData.leaveType)} in ${currentYear}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit(formData);
      // Reset form only if submission was successful
      setFormData({
        employeeId: "",
        leaveType: "",
        startDate: "",
        endDate: "",
        days: "",
        reason: "",
        contactInfo: "",
      });
      setCalculatedDays(0);
      setSelectedEmployee(null);
      setLeaveUsage(null);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getLeaveTypeLabel = (leaveType: string): string => {
    const type = leaveTypes.find((t) => t.value === leaveType);
    return type ? type.label : leaveType;
  };

  // Check if a leave type has remaining days
  const hasRemainingDays = (leaveType: string): boolean => {
    if (!leaveUsage) return true;

    if (leaveType === "UNPAID") return true; // Unlimited unpaid leave

    const remaining = leaveUsage.remainingDays[leaveType] || 0;
    return remaining > 0;
  };

  // Get remaining days for a leave type
  const getRemainingDays = (leaveType: string): number => {
    if (!leaveUsage) return 0;

    if (leaveType === "UNPAID") return Infinity; // Unlimited

    return leaveUsage.remainingDays[leaveType] || 0;
  };

  // Get used days for a leave type
  const getUsedDays = (leaveType: string): number => {
    if (!leaveUsage) return 0;
    return leaveUsage.usedDays[leaveType] || 0;
  };

  // Get allocation for a leave type
  const getAllocation = (leaveType: string): number => {
    if (!leaveUsage) return 0;

    if (leaveType === "UNPAID") return Infinity; // Unlimited

    return leaveUsage.allocation[leaveType] || 0;
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else {
        throw new Error("Failed to fetch employees");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter only active employees
  const activeEmployees = employees.filter((emp) => emp.status === "ACTIVE");

  // Calculate if the submit button should be disabled
  const isSubmitDisabled =
    isSubmitting ||
    isLoading ||
    activeEmployees.length === 0 ||
    !selectedEmployee ||
    isLoadingUsage ||
    (!!formData.leaveType &&
      formData.leaveType !== "UNPAID" &&
      !!leaveUsage &&
      parseInt(formData.days || "0") > getRemainingDays(formData.leaveType));

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {/* Current Year Info */}
        <div className="p-3 bg-blue-50 dark:bg-zinc-700 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-zinc-100">
                Current Leave Year: {currentYear}
              </h4>
              <p className="text-xs text-blue-600 dark:text-zinc-100">
                Leave balances are calculated based on approved leaves in{" "}
                {currentYear}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="space-y-2">
          <Label htmlFor="employee">Select Employee *</Label>
          <Select
            value={formData.employeeId}
            onValueChange={(value) => handleChange("employeeId", value)}
            required
            disabled={isLoading}
          >
            <SelectTrigger id="employee">
              <SelectValue
                placeholder={
                  isLoading ? "Loading employees..." : "Select an employee"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {activeEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.employeeId}>
                  {employee.name} ({employee.employeeId}) -{" "}
                  {employee.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && (
            <p className="text-xs text-muted-foreground">
              Loading employees...
            </p>
          )}
          {!isLoading && activeEmployees.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No active employees found
            </p>
          )}
        </div>

        {/* Employee Leave Balance Info */}
        {selectedEmployee && (
          <div className="p-3 bg-blue-50 dark:bg-zinc-700 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-zinc-100 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-zinc-100">
                    Leave Balance for {selectedEmployee.name} ({currentYear})
                  </h4>
                  {leaveUsage && (
                    <Badge variant="outline" className="text-xs">
                      {currentYear}
                    </Badge>
                  )}
                </div>
                {isLoadingUsage ? (
                  <p className="text-xs text-blue-600 dark:text-zinc-100">
                    Loading leave balance...
                  </p>
                ) : leaveUsage ? (
                  <div className="grid grid-cols-2 gap-2">
                    {leaveTypes.map((type) => {
                      const remaining = getRemainingDays(type.value);
                      const used = getUsedDays(type.value);
                      const allocation = getAllocation(type.value);
                      const isExhausted =
                        remaining === 0 && type.value !== "UNPAID";

                      return (
                        <div
                          key={type.value}
                          className={`p-2 rounded text-xs ${
                            isExhausted
                              ? "bg-red-50 dark:bg-zinc-800 border border-red-200"
                              : "bg-white dark:bg-zinc-800 border border-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{type.label}:</span>
                            <div className="flex items-center space-x-1">
                              {isExhausted ? (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </div>
                          <div className="mt-1">
                            {type.value === "UNPAID" ? (
                              <span className="text-green-600">Unlimited</span>
                            ) : (
                              <span
                                className={
                                  isExhausted
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {remaining} days remaining
                              </span>
                            )}
                            {type.value !== "UNPAID" && (
                              <div className="text-gray-500 dark:text-zinc-300">
                                ({used}/{allocation} days used in {currentYear})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-blue-600">
                    Unable to load leave balance
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rest of the form remains the same */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) => handleChange("leaveType", value)}
              required
              disabled={!selectedEmployee || isLoadingUsage}
            >
              <SelectTrigger id="leaveType">
                <SelectValue
                  placeholder={
                    !selectedEmployee
                      ? "Select an employee first"
                      : isLoadingUsage
                        ? "Loading leave types..."
                        : "Select leave type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => {
                  const remaining = getRemainingDays(type.value);
                  const isDisabled =
                    !hasRemainingDays(type.value) && type.value !== "UNPAID";
                  const allocation = getAllocation(type.value);

                  return (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      disabled={isDisabled}
                      className={
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{type.label}</span>
                        {type.value === "UNPAID" ? (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Unlimited
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`ml-2 text-xs ${
                              remaining === 0
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            {remaining}/{allocation}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formData.leaveType &&
              leaveUsage &&
              formData.leaveType !== "UNPAID" && (
                <p className="text-xs text-muted-foreground">
                  {getRemainingDays(formData.leaveType)} days remaining out of{" "}
                  {getAllocation(formData.leaveType)} for {currentYear}
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Input
              id="days"
              type="number"
              value={formData.days}
              readOnly
              className="bg-muted"
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-muted-foreground">
              Calculated automatically from dates
            </p>
          </div>
        </div>

        {/* Leave Allocation Warning */}
        {selectedEmployee &&
          formData.leaveType &&
          formData.days &&
          formData.leaveType !== "UNPAID" &&
          leaveUsage && (
            <div
              className={`p-3 rounded-md ${
                parseInt(formData.days) > getRemainingDays(formData.leaveType)
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                {parseInt(formData.days) >
                getRemainingDays(formData.leaveType) ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <p
                  className={`text-sm ${
                    parseInt(formData.days) >
                    getRemainingDays(formData.leaveType)
                      ? "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  <strong>
                    {parseInt(formData.days) >
                    getRemainingDays(formData.leaveType)
                      ? "Warning: "
                      : "Available: "}
                  </strong>
                  {getRemainingDays(formData.leaveType)} days available for{" "}
                  {getLeaveTypeLabel(formData.leaveType)} in {currentYear}
                  {parseInt(formData.days) >
                    getRemainingDays(formData.leaveType) &&
                    ` (Requested: ${formData.days} days)`}
                </p>
              </div>
            </div>
          )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              required
              min={`${currentYear}-01-01`}
              max={`${currentYear}-12-31`}
            />
            <p className="text-xs text-muted-foreground">
              Must be within {currentYear}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              min={formData.startDate || `${currentYear}-01-01`}
              max={`${currentYear}-12-31`}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be within {currentYear}
            </p>
          </div>
        </div>

        {calculatedDays > 0 && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Leave Duration:</strong> {calculatedDays} day
              {calculatedDays !== 1 ? "s" : ""}
              {calculatedDays > 1 &&
                ` (${formData.startDate} to ${formData.endDate})`}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Leave *</Label>
          <Textarea
            id="reason"
            placeholder="Provide the reason for this leave request..."
            rows={4}
            value={formData.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactInfo">
            Employee Contact During Leave (Optional)
          </Label>
          <Input
            id="contactInfo"
            placeholder="Employee's phone number or email for contact during leave"
            value={formData.contactInfo}
            onChange={(e) => handleChange("contactInfo", e.target.value)}
          />
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This leave request will be submitted on
            behalf of the selected employee. Leave balances are calculated based
            on approved leaves in {currentYear}.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? "Submitting..." : "Submit Leave Request"}
        </Button>
      </DialogFooter>
    </form>
  );
}
