import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  Loader2,
  Trash2,
  User,
  Briefcase,
  Building,
  X,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types based on your API response structure
interface ApiEmployee {
  id: string;
  employeeId?: string;
  employeeNumber: string;
  name: string; // Combined name field
  email?: string | null;
  phone?: string | null;
  position: string;
  department: string; // String department name
  status: string;
  avatar?: string;
  location?: string;
  manager?: string;
  salary?: number;
  salaryType?: string;
  startDate?: string;
  workType?: string;
  overtimeHourRate?: number;
}

interface ApiFreelancer {
  id: string;
  freeLancerId?: string;
  freeLancerNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position: string;
  department: string; // String department name
  status: string;
  avatar?: string;
  location?: string;
  manager?: string;
  salary?: number;
  startDate?: string;
  workType?: string;
  overtimeHourRate?: number;
  reliable?: boolean;
}

interface BypassRule {
  id: string;
  startDate: Date;
  endDate: Date;
  bypassCheckIn: boolean;
  bypassCheckOut: boolean;
  customCheckInTime?: string | null;
  customCheckOutTime?: string | null;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employees: ApiEmployee[];
  freelancers: ApiFreelancer[];
}

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveRules?: (rules: BypassRule[]) => void;
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  onSaveRules,
}: SettingsDialogProps) {
  const [rules, setRules] = useState<BypassRule[]>([]);
  const [newRule, setNewRule] = useState({
    bypassCheckIn: false,
    bypassCheckOut: false,
    customCheckInTime: "none" as string | null,
    customCheckOutTime: "none" as string | null,
    reason: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // State for assignees
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [freelancers, setFreelancers] = useState<ApiFreelancer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-select state
  const [selectedEmployees, setSelectedEmployees] = useState<ApiEmployee[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<
    ApiFreelancer[]
  >([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [freelancerSearch, setFreelancerSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"employees" | "freelancers">(
    "employees"
  );

  // Fetch assignees and existing rules when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAssignees();
      fetchBypassRules();
    }
  }, [isOpen]);

  const fetchAssignees = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching assignees...");

      const [employeesResponse, freelancersResponse] = await Promise.all([
        axios.get("/api/employees?status=ACTIVE"),
        axios.get("/api/freelancers?status=ACTIVE"),
      ]);

      console.log("Employees API response:", employeesResponse.data);
      console.log("Freelancers API response:", freelancersResponse.data);

      // Extract data from response - adjust based on actual API structure
      const employeesData = Array.isArray(employeesResponse.data?.employees)
        ? employeesResponse.data.employees
        : employeesResponse.data?.employees?.employees || [];

      const freelancersData = Array.isArray(
        freelancersResponse.data?.freelancers
      )
        ? freelancersResponse.data.freelancers
        : freelancersResponse.data?.freelancers?.freelancers || [];

      console.log(
        `Found ${employeesData.length} employees, ${freelancersData.length} freelancers`
      );

      // Log first employee to see structure
      if (employeesData.length > 0) {
        console.log("First employee:", employeesData[0]);
      }

      setEmployees(employeesData);
      setFreelancers(freelancersData);
    } catch (err: any) {
      console.error("Error fetching assignees:", err);
      console.error("Error details:", err.response?.data);
      toast.error(`Failed to load assignees: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBypassRules = async () => {
    try {
      console.log("Fetching bypass rules...");
      const response = await axios.get("/api/attendance-bypass");
      console.log("Full API response:", response.data);
      console.log("Bypass rules data:", response.data.bypassRules);

      if (
        response.data.bypassRules &&
        Array.isArray(response.data.bypassRules)
      ) {
        const rulesWithDates = response.data.bypassRules.map((rule: any) => {
          console.log("Processing rule:", rule);
          console.log("Rule employees:", rule.employees);
          console.log("Rule freelancers:", rule.freelancers);

          return {
            ...rule,
            startDate: new Date(rule.startDate),
            endDate: new Date(rule.endDate),
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
            employees: Array.isArray(rule.employees)
              ? rule.employees.map((emp: any) => ({
                  id: emp.id,
                  employeeNumber: emp.employeeNumber || emp.employeeId || "N/A",
                  name:
                    emp.name ||
                    `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                    "Unknown",
                  position: emp.position || "Not specified",
                  department: emp.department || "Not specified",
                  status: emp.status || "ACTIVE",
                  ...emp,
                }))
              : [],
            freelancers: Array.isArray(rule.freelancers)
              ? rule.freelancers.map((freelancer: any) => ({
                  id: freelancer.id,
                  freeLancerNumber:
                    freelancer.freeLancerNumber ||
                    freelancer.freeLancerId ||
                    "N/A",
                  firstName: freelancer.firstName || "",
                  lastName: freelancer.lastName || "",
                  position: freelancer.position || "Not specified",
                  department: freelancer.department || "Not specified",
                  status: freelancer.status || "ACTIVE",
                  ...freelancer,
                }))
              : [],
          };
        });

        console.log("Processed rules:", rulesWithDates);
        setRules(rulesWithDates);
      } else {
        console.warn("No bypass rules found or invalid format");
        setRules([]);
      }
    } catch (err: any) {
      console.error("Error fetching bypass rules:", err);
      console.error("Error response:", err.response?.data);
      toast.error(`Failed to load existing rules: ${err.message}`);
    }
  };

  // Filter assignees based on search
  const filteredEmployees = employees.filter((emp) => {
    const searchTerm = employeeSearch.toLowerCase();
    const name = emp.name?.toLowerCase() || "";
    const employeeNumber = emp.employeeNumber?.toLowerCase() || "";
    const position = emp.position?.toLowerCase() || "";
    const department = emp.department?.toLowerCase() || "";

    return (
      name.includes(searchTerm) ||
      employeeNumber.includes(searchTerm) ||
      position.includes(searchTerm) ||
      department.includes(searchTerm)
    );
  });

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const searchTerm = freelancerSearch.toLowerCase();
    const fullName =
      `${freelancer.firstName || ""} ${freelancer.lastName || ""}`.toLowerCase();
    const freeLancerNumber = freelancer.freeLancerNumber?.toLowerCase() || "";
    const position = freelancer.position?.toLowerCase() || "";
    const department = freelancer.department?.toLowerCase() || "";

    return (
      fullName.includes(searchTerm) ||
      freeLancerNumber.includes(searchTerm) ||
      position.includes(searchTerm) ||
      department.includes(searchTerm)
    );
  });

  // Check if assignee is selected
  const isEmployeeSelected = (employeeId: string) => {
    return selectedEmployees.some((emp) => emp.id === employeeId);
  };

  const isFreelancerSelected = (freelancerId: string) => {
    return selectedFreelancers.some(
      (freelancer) => freelancer.id === freelancerId
    );
  };

  // Toggle selection
  const handleEmployeeSelect = (employee: ApiEmployee) => {
    if (isEmployeeSelected(employee.id)) {
      setSelectedEmployees(
        selectedEmployees.filter((emp) => emp.id !== employee.id)
      );
    } else {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
  };

  const handleFreelancerSelect = (freelancer: ApiFreelancer) => {
    if (isFreelancerSelected(freelancer.id)) {
      setSelectedFreelancers(
        selectedFreelancers.filter((f) => f.id !== freelancer.id)
      );
    } else {
      setSelectedFreelancers([...selectedFreelancers, freelancer]);
    }
  };

  // Remove selected assignee
  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.id !== employeeId)
    );
  };

  const removeFreelancer = (freelancerId: string) => {
    setSelectedFreelancers(
      selectedFreelancers.filter((f) => f.id !== freelancerId)
    );
  };

  // Get display name with fallbacks
  const getEmployeeDisplayName = (employee: ApiEmployee) => {
    return employee.name || `Employee ${employee.employeeNumber}`;
  };

  const getFreelancerDisplayName = (freelancer: ApiFreelancer) => {
    return (
      `${freelancer.firstName || ""} ${freelancer.lastName || ""}`.trim() ||
      `Freelancer ${freelancer.freeLancerNumber}`
    );
  };

  // Generate time options
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        const time = `${hourStr}:${minuteStr}`;
        const displayTime = format(new Date(0, 0, 0, hour, minute), "hh:mm a");
        times.push({ value: time, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleAddRule = async () => {
    if (
      !newRule.startDate ||
      !newRule.endDate ||
      (selectedEmployees.length === 0 && selectedFreelancers.length === 0)
    ) {
      toast.error("Please select dates and at least one assignee");
      return;
    }

    if (newRule.startDate > newRule.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    // Validate custom times
    if (
      newRule.customCheckInTime &&
      newRule.customCheckInTime !== "none" &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newRule.customCheckInTime)
    ) {
      toast.error("Invalid check-in time format. Use HH:mm (24-hour format)");
      return;
    }

    if (
      newRule.customCheckOutTime &&
      newRule.customCheckOutTime !== "none" &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newRule.customCheckOutTime)
    ) {
      toast.error("Invalid check-out time format. Use HH:mm (24-hour format)");
      return;
    }

    try {
      setIsSaving(true);

      const ruleData = {
        startDate: newRule.startDate.toISOString(),
        endDate: newRule.endDate.toISOString(),
        bypassCheckIn: newRule.bypassCheckIn,
        bypassCheckOut: newRule.bypassCheckOut,
        reason: newRule.reason || null,
        employeeIds: selectedEmployees.map((emp) => emp.id),
        freelancerIds: selectedFreelancers.map((freelancer) => freelancer.id),
        customCheckInTime:
          newRule.customCheckInTime && newRule.customCheckInTime !== "none"
            ? newRule.customCheckInTime
            : null,
        customCheckOutTime:
          newRule.customCheckOutTime && newRule.customCheckOutTime !== "none"
            ? newRule.customCheckOutTime
            : null,
      };

      console.log("Creating rule with data:", ruleData);

      const response = await axios.post("/api/attendance-bypass", ruleData);
      console.log("Create rule response:", response.data);

      // Process the new rule for state
      const newRuleData = response.data.bypassRule;
      const processedRule = {
        ...newRuleData,
        startDate: new Date(newRuleData.startDate),
        endDate: new Date(newRuleData.endDate),
        createdAt: new Date(newRuleData.createdAt),
        updatedAt: new Date(newRuleData.updatedAt),
        employees: Array.isArray(newRuleData.employees)
          ? newRuleData.employees.map((emp: any) => ({
              id: emp.id,
              employeeNumber: emp.employeeNumber || emp.employeeId || "N/A",
              name:
                emp.name ||
                `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                "Unknown",
              position: emp.position || "Not specified",
              department: emp.department || "Not specified",
              status: emp.status || "ACTIVE",
              ...emp,
            }))
          : [],
        freelancers: Array.isArray(newRuleData.freelancers)
          ? newRuleData.freelancers.map((freelancer: any) => ({
              id: freelancer.id,
              freeLancerNumber:
                freelancer.freeLancerNumber || freelancer.freeLancerId || "N/A",
              firstName: freelancer.firstName || "",
              lastName: freelancer.lastName || "",
              position: freelancer.position || "Not specified",
              department: freelancer.department || "Not specified",
              status: freelancer.status || "ACTIVE",
              ...freelancer,
            }))
          : [],
      };

      setRules([...rules, processedRule]);

      // Reset form
      setNewRule({
        bypassCheckIn: false,
        bypassCheckOut: false,
        customCheckInTime: "none",
        customCheckOutTime: "none",
        reason: "",
        startDate: undefined,
        endDate: undefined,
      });
      setSelectedEmployees([]);
      setSelectedFreelancers([]);
      setEmployeeSearch("");
      setFreelancerSearch("");

      toast.success("Bypass rule created successfully");

      if (onSaveRules) {
        onSaveRules([...rules, processedRule]);
      }
    } catch (error: any) {
      console.error("Error creating bypass rule:", error);
      console.error("Error details:", error.response?.data);
      toast.error(
        error.response?.data?.error || "Failed to create bypass rule"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await axios.delete(`/api/attendance-bypass?id=${id}`);
      setRules(rules.filter((rule) => rule.id !== id));
      toast.success("Rule deleted successfully");

      if (onSaveRules) {
        onSaveRules(rules.filter((rule) => rule.id !== id));
      }
    } catch (error: any) {
      console.error("Error deleting bypass rule:", error);
      toast.error(error.response?.data?.error || "Failed to delete rule");
    }
  };

  const formatTimeForDisplay = (time: string | null | undefined) => {
    if (!time || time === "none") return "No specific time";
    try {
      const [hours, minutes] = time.split(":").map(Number);
      return format(new Date(0, 0, 0, hours, minutes), "hh:mm a");
    } catch {
      return time;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Bypass Settings</DialogTitle>
          <DialogDescription>
            Configure bypass rules for check-in/out time restrictions. You can
            select multiple employees and freelancers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Rule Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Add New Bypass Rule</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading assignees...</span>
              </div>
            ) : (
              <>
                {/* Selected Assignees Summary */}
                {(selectedEmployees.length > 0 ||
                  selectedFreelancers.length > 0) && (
                  <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Selected Assignees</h4>
                      <span className="text-sm text-muted-foreground">
                        {selectedEmployees.length + selectedFreelancers.length}{" "}
                        total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedEmployees.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Employees ({selectedEmployees.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                              >
                                <span>{getEmployeeDisplayName(employee)}</span>
                                <button
                                  type="button"
                                  onClick={() => removeEmployee(employee.id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedFreelancers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Freelancers ({selectedFreelancers.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedFreelancers.map((freelancer) => (
                              <div
                                key={freelancer.id}
                                className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                              >
                                <span>
                                  {getFreelancerDisplayName(freelancer)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFreelancer(freelancer.id)
                                  }
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployees([]);
                          setSelectedFreelancers([]);
                        }}
                        className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Assignee Selection Tabs */}
                <div className="space-y-4">
                  <div className="flex border-b">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-center font-medium ${activeTab === "employees" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                      onClick={() => setActiveTab("employees")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Employees ({employees.length})</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-center font-medium ${activeTab === "freelancers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                      onClick={() => setActiveTab("freelancers")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Freelancers ({freelancers.length})</span>
                      </div>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Input
                      placeholder={`Search ${activeTab}...`}
                      value={
                        activeTab === "employees"
                          ? employeeSearch
                          : freelancerSearch
                      }
                      onChange={(e) =>
                        activeTab === "employees"
                          ? setEmployeeSearch(e.target.value)
                          : setFreelancerSearch(e.target.value)
                      }
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {activeTab === "employees" ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Assignee List */}
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {activeTab === "employees" ? (
                      filteredEmployees.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          {employeeSearch
                            ? "No matching employees found"
                            : "No employees available"}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredEmployees.map((employee) => {
                            const isSelected = isEmployeeSelected(employee.id);
                            return (
                              <div
                                key={employee.id}
                                className={`p-3 cursor-pointer hover:bg-accent ${isSelected ? "bg-accent" : ""}`}
                                onClick={() => handleEmployeeSelect(employee)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border"}`}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 text-primary-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {getEmployeeDisplayName(employee)}
                                          </span>
                                          {isSelected && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                              Selected
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                            <span>
                                              {employee.position ||
                                                "No position"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                              {employee.employeeNumber ||
                                                "No ID"}
                                            </span>
                                            {employee.department && (
                                              <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                  <Building className="h-3 w-3" />
                                                  {employee.department}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : filteredFreelancers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        {freelancerSearch
                          ? "No matching freelancers found"
                          : "No freelancers available"}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredFreelancers.map((freelancer) => {
                          const isSelected = isFreelancerSelected(
                            freelancer.id
                          );
                          return (
                            <div
                              key={freelancer.id}
                              className={`p-3 cursor-pointer hover:bg-accent ${isSelected ? "bg-accent" : ""}`}
                              onClick={() => handleFreelancerSelect(freelancer)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border"}`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {getFreelancerDisplayName(freelancer)}
                                        </span>
                                        {isSelected && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                            Selected
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                          <span>
                                            {freelancer.position ||
                                              "No position"}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {freelancer.freeLancerNumber ||
                                              "No ID"}
                                          </span>
                                          {freelancer.department && (
                                            <>
                                              <span>•</span>
                                              <span className="flex items-center gap-1">
                                                <Building className="h-3 w-3" />
                                                {freelancer.department}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Input
                      value={newRule.reason}
                      onChange={(e) =>
                        setNewRule({ ...newRule, reason: e.target.value })
                      }
                      placeholder="e.g., Business trip, Training, Remote work"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newRule.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newRule.startDate ? (
                              format(newRule.startDate, "MMM dd, yyyy")
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newRule.startDate}
                            onSelect={(date) =>
                              setNewRule({ ...newRule, startDate: date })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newRule.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newRule.endDate ? (
                              format(newRule.endDate, "MMM dd, yyyy")
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newRule.endDate}
                            onSelect={(date) =>
                              setNewRule({ ...newRule, endDate: date })
                            }
                            initialFocus
                            disabled={(date) =>
                              newRule.startDate
                                ? date < newRule.startDate
                                : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Time Settings Section */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Time Settings</h4>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bypass-checkin"
                          checked={newRule.bypassCheckIn}
                          onCheckedChange={(checked) =>
                            setNewRule({
                              ...newRule,
                              bypassCheckIn: checked as boolean,
                              customCheckInTime: checked ? "none" : null,
                            })
                          }
                        />
                        <Label
                          htmlFor="bypass-checkin"
                          className="cursor-pointer"
                        >
                          Bypass Check-In Time Restrictions
                        </Label>
                      </div>

                      {newRule.bypassCheckIn && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor="custom-checkin-time"
                            className="whitespace-nowrap"
                          >
                            Custom time:
                          </Label>
                          <select
                            value={newRule.customCheckInTime || "none"}
                            onChange={(e) =>
                              setNewRule({
                                ...newRule,
                                customCheckInTime: e.target.value,
                              })
                            }
                            className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="none">No specific time</option>
                            {timeOptions.map((time) => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bypass-checkout"
                          checked={newRule.bypassCheckOut}
                          onCheckedChange={(checked) =>
                            setNewRule({
                              ...newRule,
                              bypassCheckOut: checked as boolean,
                              customCheckOutTime: checked ? "none" : null,
                            })
                          }
                        />
                        <Label
                          htmlFor="bypass-checkout"
                          className="cursor-pointer"
                        >
                          Bypass Check-Out Time Restrictions
                        </Label>
                      </div>

                      {newRule.bypassCheckOut && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor="custom-checkout-time"
                            className="whitespace-nowrap"
                          >
                            Custom time:
                          </Label>
                          <select
                            value={newRule.customCheckOutTime || "none"}
                            onChange={(e) =>
                              setNewRule({
                                ...newRule,
                                customCheckOutTime: e.target.value,
                              })
                            }
                            className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="none">No specific time</option>
                            {timeOptions.map((time) => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddRule}
                  className="w-full mt-4"
                  disabled={
                    isSaving ||
                    !newRule.startDate ||
                    !newRule.endDate ||
                    (selectedEmployees.length === 0 &&
                      selectedFreelancers.length === 0)
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Rule...
                    </>
                  ) : (
                    `Create Bypass Rule for ${selectedEmployees.length + selectedFreelancers.length} Assignee${selectedEmployees.length + selectedFreelancers.length !== 1 ? "s" : ""}`
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Existing Rules List - UPDATED WITH DEBUGGING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Active Bypass Rules</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {rules.length} rule{rules.length !== 1 ? "s" : ""} active
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchBypassRules()}
                  className="h-7 text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">No active bypass rules</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add rules above to bypass time restrictions for specific
                  assignees
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {rules.map((rule) => {
                  const employeeCount = rule.employees?.length || 0;
                  const freelancerCount = rule.freelancers?.length || 0;
                  const totalAssignees = employeeCount + freelancerCount;

                  console.log(`Rule ${rule.id}:`, {
                    employeeCount,
                    freelancerCount,
                    employees: rule.employees,
                    freelancers: rule.freelancers,
                  });

                  return (
                    <div
                      key={rule.id}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-lg">
                                  Bypass Rule
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                  {totalAssignees} assignee
                                  {totalAssignees !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            {/* Debug info - remove in production */}
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
                              Rule ID: {rule.id}
                              <br />
                              Employees: {employeeCount}, Freelancers:{" "}
                              {freelancerCount}
                            </div>

                            {/* Assignees List */}
                            <div className="space-y-3">
                              {/* Employees Section */}
                              {employeeCount > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Employees ({employeeCount})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {rule.employees?.map((employee, index) => {
                                      const displayName =
                                        getEmployeeDisplayName(employee);
                                      console.log(
                                        `Employee ${index}:`,
                                        employee,
                                        "Display name:",
                                        displayName
                                      );

                                      return (
                                        <div
                                          key={employee.id || index}
                                          className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                                        >
                                          <span>{displayName}</span>
                                          {employee.employeeNumber && (
                                            <span className="text-xs opacity-75 ml-1">
                                              ({employee.employeeNumber})
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Freelancers Section */}
                              {freelancerCount > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Freelancers ({freelancerCount})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {rule.freelancers?.map(
                                      (freelancer, index) => {
                                        const displayName =
                                          getFreelancerDisplayName(freelancer);
                                        console.log(
                                          `Freelancer ${index}:`,
                                          freelancer,
                                          "Display name:",
                                          displayName
                                        );

                                        return (
                                          <div
                                            key={freelancer.id || index}
                                            className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                                          >
                                            <span>{displayName}</span>
                                            {freelancer.freeLancerNumber && (
                                              <span className="text-xs opacity-75 ml-1">
                                                ({freelancer.freeLancerNumber})
                                              </span>
                                            )}
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}

                              {employeeCount === 0 && freelancerCount === 0 && (
                                <div className="text-sm text-muted-foreground italic">
                                  No assignees found for this rule
                                </div>
                              )}
                            </div>

                            {rule.reason && (
                              <div className="mt-3 p-2 bg-muted/30 rounded">
                                <p className="text-sm">
                                  <span className="font-medium text-muted-foreground">
                                    Reason:
                                  </span>{" "}
                                  {rule.reason}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Period:
                              </p>
                              <p className="text-sm font-medium">
                                {format(rule.startDate, "MMM dd, yyyy")} -{" "}
                                {format(rule.endDate, "MMM dd, yyyy")}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Time Settings:
                              </p>
                              <div className="flex flex-col gap-2">
                                {rule.bypassCheckIn && (
                                  <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {rule.customCheckInTime &&
                                      rule.customCheckInTime !== "none"
                                        ? `Check-In @ ${formatTimeForDisplay(rule.customCheckInTime)}`
                                        : "No Check-In Time Restriction"}
                                    </div>
                                  </div>
                                )}
                                {rule.bypassCheckOut && (
                                  <div className="flex items-center gap-2">
                                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {rule.customCheckOutTime &&
                                      rule.customCheckOutTime !== "none"
                                        ? `Check-Out @ ${formatTimeForDisplay(rule.customCheckOutTime)}`
                                        : "No Check-Out Time Restriction"}
                                    </div>
                                  </div>
                                )}
                                {!rule.bypassCheckIn &&
                                  !rule.bypassCheckOut && (
                                    <span className="text-xs text-muted-foreground italic">
                                      No time bypass enabled
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            Created by {rule.createdBy || "system"} •{" "}
                            {format(new Date(rule.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
