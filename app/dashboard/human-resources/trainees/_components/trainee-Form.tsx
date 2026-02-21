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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CalendarIcon, MapPin, Clock, X } from "lucide-react";
import { Department, Trainee, TraineeStatus } from "@prisma/client";
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
import { traineeSchema, traineeSchemaType } from "@/lib/formValidationSchemas";

interface TraineeFormProps {
  type: "create" | "update";
  data?: Partial<Trainee>;
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

export default function TraineeForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: TraineeFormProps) {
  const router = useRouter();
  const [departmentsOptions, setDepartmentsOptions] = useState<
    ComboboxOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string") return new Date(dateValue);
    return undefined;
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

  const form = useForm<traineeSchemaType>({
    resolver: zodResolver(traineeSchema),
    defaultValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phone: data?.phone || "",
      position: data?.position || "",
      reliable: data?.reliable || false,
      email: data?.email || "",
      departmentId: data?.departmentId || "",
      salary: data?.salary ? Number(data.salary) : 0,
      overtimeHourRate: data?.overtimeHourRate
        ? Number(data.overtimeHourRate)
        : 50.0,
      emergencyCallOutRate: data?.emergencyCallOutRate
        ? Number(data.emergencyCallOutRate)
        : 0.0,
      hireDate: parseDate(data?.hireDate) || new Date(),
      terminationDate: parseDate(data?.terminationDate),
      status: (data?.status as any) || "ACTIVE",
      // Address fields with defaults
      address: data?.address || "",
      city: data?.city || "",
      province: data?.province || "",
      postalCode: data?.postalCode || "",
      country: data?.country || "South Africa",
      // Schedule fields
      scheduledKnockIn: data?.scheduledKnockIn || "09:00",
      scheduledKnockOut: data?.scheduledKnockOut || "17:00",
      scheduledWeekendKnockIn: data?.scheduledWeekendKnockIn || "09:00",
      scheduledWeekendKnockOut: data?.scheduledWeekendKnockOut || "17:00",
      workingDays: parseWorkingDays(data?.workingDays) || [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
      ],
    },
  });

  // Watch form values
  const workingDays = form.watch("workingDays");

  // Check if weekend days are selected
  const hasWeekendWork =
    workingDays?.includes("SAT") || workingDays?.includes("SUN");

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

  const onSubmit = async (values: traineeSchemaType) => {
    setIsLoading(true);
    try {
      const formattedData = {
        ...values,
        workingDays: values.workingDays,
      };

      if (type === "create") {
        await axios.post("/api/trainees", formattedData);
        toast.success("Trainee created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/trainees/${data.id}`, {
          ...formattedData,
          avatar: data.avatar,
        });
        toast.success("Trainee updated successfully");
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

  const handleClearTerminationDate = () => {
    form.setValue("terminationDate", undefined);
  };

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
          {/* Salary */}
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Per Day</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Overtime Rate Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
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
            {/* Callout Rate Field */}
            <FormField
              control={form.control}
              name="emergencyCallOutRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Call-out Rate (R)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter call-out rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Hire Date */}
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commencement Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Termination Date - Always shown but optional */}
          <FormField
            control={form.control}
            name="terminationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  Contract End Date (Optional)
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearTerminationDate}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick termination date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const hireDate = form.getValues("hireDate");
                        return hireDate && date < hireDate;
                      }}
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
                    {Object.values(TraineeStatus).map((status) => (
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

          {/* Reliable Field */}
          <FormField
            control={form.control}
            name="reliable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Reliable Funded Trainee</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mark this funded Trainee as reliable for future assignments
                  </div>
                </div>
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
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Schedule Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Scheduled Knock In */}
            <FormField
              control={form.control}
              name="scheduledKnockIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekday Knock In Time</FormLabel>
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
                  <FormLabel>Weekday Knock Out Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekend Schedule - Conditionally shown */}
            {hasWeekendWork && (
              <>
                <FormField
                  control={form.control}
                  name="scheduledWeekendKnockIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekend Knock In Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Applies when Saturday or Sunday is selected
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledWeekendKnockOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekend Knock Out Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Applies when Saturday or Sunday is selected
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {!hasWeekendWork && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Weekend schedule fields will appear when
                you select Saturday or Sunday as working days.
              </div>
            </div>
          )}
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
                  Select the days this trainee is scheduled to work
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
                                        (value) => value !== day.id,
                                      ),
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
              "Create Trainee"
            ) : (
              "Update Trainee"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
