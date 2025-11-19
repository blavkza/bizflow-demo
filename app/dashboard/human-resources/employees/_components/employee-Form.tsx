"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  employeeSchema,
  employeeSchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarIcon,
  Calculator,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";
import {
  Department,
  Employee,
  EmployeeStatus,
  SalaryType,
} from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface EmployeeFormProps {
  type: "create" | "update";
  data?: Partial<Employee>;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
};

// Working days options
const WORKING_DAYS = [
  { id: "MON", label: "Monday" },
  { id: "TUE", label: "Tuesday" },
  { id: "WED", label: "Wednesday" },
  { id: "THU", label: "Thursday" },
  { id: "FRI", label: "Friday" },
  { id: "SAT", label: "Saturday" },
  { id: "SUN", label: "Sunday" },
];

// South African provinces
const SOUTH_AFRICAN_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

// Constants for calculations
const WORKING_DAYS_PER_MONTH = 22; // Average working days per month

export default function EmployeeForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: EmployeeFormProps) {
  const router = useRouter();
  const [departmentsOptions, setDepartmentsOptions] = useState<
    ComboboxOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBothSalaries, setShowBothSalaries] = useState(false);

  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string") return new Date(dateValue);
    return new Date();
  };

  // Parse working days from database
  const parseWorkingDays = (workingDays: any): string[] => {
    if (!workingDays) return [];
    if (Array.isArray(workingDays)) return workingDays;
    try {
      return JSON.parse(workingDays);
    } catch {
      return [];
    }
  };

  const form = useForm<employeeSchemaType>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phone: data?.phone || "",
      position: data?.position || "",
      email: data?.email || "",
      departmentId: data?.departmentId || "",
      salaryType: data?.salaryType || "MONTHLY",
      dailySalary: data?.dailySalary ? Number(data.dailySalary) : 0,
      monthlySalary: data?.monthlySalary ? Number(data.monthlySalary) : 0,
      overtimeHourRate: data?.overtimeHourRate
        ? Number(data.overtimeHourRate)
        : 50.0,

      hireDate: parseDate(data?.hireDate),
      status: data?.status || "ACTIVE",
      // Address fields with defaults
      address: data?.address || "",
      city: data?.city || "",
      province: data?.province || "",
      postalCode: data?.postalCode || "",
      country: data?.country || "South Africa",
      scheduledKnockIn: data?.scheduledKnockIn || "09:00",
      scheduledKnockOut: data?.scheduledKnockOut || "17:00",
      workingDays: parseWorkingDays(data?.workingDays) || [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
      ],
    },
  });

  // Watch salary type and values for calculations
  const salaryType = form.watch("salaryType");
  const dailySalary = form.watch("dailySalary");
  const monthlySalary = form.watch("monthlySalary");

  // Safe type guards
  const getDailySalary = (): number => {
    return dailySalary || 0;
  };

  const getMonthlySalary = (): number => {
    return monthlySalary || 0;
  };

  // Auto-calculate salaries when one changes (only if not showing both)
  useEffect(() => {
    if (!showBothSalaries) {
      const currentDailySalary = getDailySalary();
      const currentMonthlySalary = getMonthlySalary();

      if (salaryType === "DAILY" && currentDailySalary > 0) {
        const calculatedMonthly = currentDailySalary * WORKING_DAYS_PER_MONTH;
        form.setValue(
          "monthlySalary",
          parseFloat(calculatedMonthly.toFixed(2))
        );
      } else if (salaryType === "MONTHLY" && currentMonthlySalary > 0) {
        const calculatedDaily = currentMonthlySalary / WORKING_DAYS_PER_MONTH;
        form.setValue("dailySalary", parseFloat(calculatedDaily.toFixed(2)));
      }
    }
  }, [dailySalary, monthlySalary, salaryType, form, showBothSalaries]);

  // Reset the non-primary salary field when switching salary type and not showing both
  useEffect(() => {
    if (!showBothSalaries) {
      const currentDailySalary = getDailySalary();
      const currentMonthlySalary = getMonthlySalary();

      if (salaryType === "DAILY" && currentMonthlySalary > 0) {
        const calculatedDaily = currentMonthlySalary / WORKING_DAYS_PER_MONTH;
        form.setValue("dailySalary", parseFloat(calculatedDaily.toFixed(2)));
      } else if (salaryType === "MONTHLY" && currentDailySalary > 0) {
        const calculatedMonthly = currentDailySalary * WORKING_DAYS_PER_MONTH;
        form.setValue(
          "monthlySalary",
          parseFloat(calculatedMonthly.toFixed(2))
        );
      }
    }
  }, [salaryType, form, showBothSalaries]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("/api/departments");
        const departments: Department[] = response.data || [];
        const options = departments.map((department) => ({
          label: department.name,
          value: department.id,
        }));
        setDepartmentsOptions(options);
      } catch (err) {
        console.error("Error fetching departments:", err);
        toast.error("Failed to load departments");
      }
    };

    fetchDepartments();
  }, []);

  const onSubmit = async (values: employeeSchemaType) => {
    setIsLoading(true);
    try {
      const formattedData = {
        ...values,
        workingDays: values.workingDays,
        // Both salary fields are guaranteed to be numbers now
        dailySalary: values.dailySalary,
        monthlySalary: values.monthlySalary,
      };

      if (type === "create") {
        await axios.post("/api/employees", formattedData);
        toast.success("Employee created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/employees/${data.id}`, {
          ...formattedData,
          avatar: data.avatar,
        });
        toast.success("Employee updated successfully");
      }

      onSubmitSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEquivalentSalary = () => {
    const currentDailySalary = getDailySalary();
    const currentMonthlySalary = getMonthlySalary();

    if (salaryType === "DAILY" && currentDailySalary > 0) {
      return {
        label: "Monthly Equivalent",
        value: (currentDailySalary * WORKING_DAYS_PER_MONTH).toFixed(2),
      };
    } else if (salaryType === "MONTHLY" && currentMonthlySalary > 0) {
      return {
        label: "Daily Equivalent",
        value: (currentMonthlySalary / WORKING_DAYS_PER_MONTH).toFixed(2),
      };
    }
    return null;
  };

  const equivalentSalary = calculateEquivalentSalary();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Position */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Position" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Department */}
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary Type */}
          <FormField
            control={form.control}
            name="salaryType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salary type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(SalaryType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "DAILY" ? "Daily Salary" : "Monthly Salary"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show Both Salaries Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={showBothSalaries}
              onCheckedChange={setShowBothSalaries}
            />
            <FormLabel className="flex items-center gap-2 cursor-pointer">
              {showBothSalaries ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Show Both Salary Fields
            </FormLabel>
          </div>

          {/* Salary Fields */}
          <div className="space-y-4 md:col-span-2">
            {/* Primary Salary Field */}
            {!showBothSalaries ? (
              <FormField
                control={form.control}
                name={salaryType === "DAILY" ? "dailySalary" : "monthlySalary"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {salaryType === "DAILY"
                        ? "Daily Salary"
                        : "Monthly Salary"}
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`Enter ${salaryType === "DAILY" ? "daily" : "monthly"} salary`}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    {equivalentSalary && (
                      <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                        <strong>{equivalentSalary.label}:</strong> R{" "}
                        {equivalentSalary.value}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              // Show Both Salary Fields
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily Salary */}
                <FormField
                  control={form.control}
                  name="dailySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Daily Salary
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter daily salary"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Based on {WORKING_DAYS_PER_MONTH} working days/month
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monthly Salary */}
                <FormField
                  control={form.control}
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Monthly Salary
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter monthly salary"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Based on {WORKING_DAYS_PER_MONTH} working days/month
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Calculation Info */}
                <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Calculation Info:</strong> When both fields are
                    shown, they are independent. The system will use the{" "}
                    {salaryType.toLowerCase()}
                    salary for payroll calculations.
                  </div>
                </div>
              </div>
            )}

            {/* Salary Type Info */}
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">
                <strong>Payroll Setting:</strong> Payroll calculations will be
                based on{" "}
                <strong>{salaryType === "DAILY" ? "daily" : "monthly"}</strong>{" "}
                salary.
                {!showBothSalaries &&
                  " The other value is calculated automatically."}
              </div>
            </div>
          </div>
          {/* Overtime Rate Field */}
          <FormField
            control={form.control}
            name="overtimeHourRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Hourly Rate (R)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter overtime rate"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Hire Date */}
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>commencement date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EmployeeStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Section */}
        <div className="space-y-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Address Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Postal Code */}
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Schedule Section */}
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-medium">Schedule Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Scheduled Knock In */}
            <FormField
              control={form.control}
              name="scheduledKnockIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Knock In Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Knock Out */}
            <FormField
              control={form.control}
              name="scheduledKnockOut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Knock Out Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Working Days */}
        <FormField
          control={form.control}
          name="workingDays"
          render={() => (
            <FormItem className="border-t pt-6">
              <div className="mb-4">
                <FormLabel className="text-base">Working Days</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Select the days this employee is scheduled to work
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {WORKING_DAYS.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="workingDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, day.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== day.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create Employee"
            ) : (
              "Update Employee"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
