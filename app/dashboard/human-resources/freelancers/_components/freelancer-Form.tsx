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
import { Loader2, CalendarIcon } from "lucide-react";
import { Department, EmployeeStatus, FreeLancer } from "@prisma/client";
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

// Define the schema here or import it properly
export const freelancerSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  position: z.string().min(1, { message: "Position is required" }),
  departmentId: z.string().min(1, { message: "Department is required" }),
  salary: z
    .union([
      z
        .string()
        .min(1, { message: "Salary is required" })
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        }),
      z.number().min(0, { message: "Salary must be positive" }),
    ])
    .transform((val) => Number(val)),
  hireDate: z.date({ required_error: "Hire date is required" }),
  status: z.nativeEnum(EmployeeStatus).default("ACTIVE"),
  address: z.string().min(1, { message: "Address is required" }),
  scheduledKnockIn: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  scheduledKnockOut: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:mm)",
    })
    .optional()
    .or(z.literal("")),
  workingDays: z.array(z.string()).default([]),
  reliable: z.boolean().optional(),
});

export type freeLancerSchemaType = z.infer<typeof freelancerSchema>;

interface FreeLancerFormProps {
  type: "create" | "update";
  data?: Partial<FreeLancer>;
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

export default function FreeLancerForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: FreeLancerFormProps) {
  const router = useRouter();
  const [departmentsOptions, setDepartmentsOptions] = useState<
    ComboboxOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const form = useForm<freeLancerSchemaType>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phone: data?.phone || "",
      position: data?.position || "",
      reliable: data?.reliable || false,
      email: data?.email || "",
      departmentId: data?.departmentId || "",
      salary: data?.salary ? Number(data.salary) : 0,
      hireDate: parseDate(data?.hireDate),
      status: data?.status || "ACTIVE",
      address: data?.address || "",
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

  const onSubmit = async (values: freeLancerSchemaType) => {
    setIsLoading(true);
    try {
      const formattedData = {
        ...values,
        workingDays: values.workingDays,
      };

      if (type === "create") {
        await axios.post("/api/freelancers", formattedData);
        toast.success("Freelancer created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/freelancers/${data.id}`, {
          ...formattedData,
          avatar: data.avatar,
        });
        toast.success("Freelancer updated successfully");
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
          {/* Hire Date */}
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commencement date</FormLabel>
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
          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

        {/* Working Days */}
        <FormField
          control={form.control}
          name="workingDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Working Days</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Select the days this freelancer is scheduled to work
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
              "Create Freelancer"
            ) : (
              "Update Freelancer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
