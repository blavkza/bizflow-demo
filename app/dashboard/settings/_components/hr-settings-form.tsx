"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneralSettingsFormLoading } from "./GeneralSettingsFormLoading";

// Validation Schema - Remove companyName and currency
const HRSettingsSchema = z.object({
  // Payroll Settings
  paymentDay: z.number().min(1).max(31),
  paymentMonth: z.string(),
  autoProcessPayroll: z.boolean(),
  workingDaysPerMonth: z.number().min(1).max(31),
  overtimeHourRate: z.number().min(1),

  // Attendance Settings
  workingHoursPerDay: z.number().min(1).max(24),
  lateThreshold: z.number().min(1),
  halfDayThreshold: z.number().min(0.5),
  overtimeThreshold: z.number().min(1),

  // Leave Settings
  annualLeaveDays: z.number().min(0),
  sickLeaveDays: z.number().min(0),
  studyLeaveDays: z.number().min(0),
  maternityLeaveDays: z.number().min(0),
  paternityLeaveDays: z.number().min(0),
  carryOverEnabled: z.boolean(),
  maxCarryOverDays: z.number().min(0),
});

type HRSettingsSchemaType = z.infer<typeof HRSettingsSchema>;

interface HRSettings {
  id: string;
  workingHoursPerDay: number;
  paymentDay: number;
  paymentMonth: string;
  overtimeHourRate: number;
  autoProcessPayroll: boolean;
  workingDaysPerMonth: number;
  lateThreshold: number;
  halfDayThreshold: number;
  overtimeThreshold: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  studyLeaveDays: number;
  maternityLeaveDays: number;
  paternityLeaveDays: number;
  carryOverEnabled: boolean;
  maxCarryOverDays: number;
}

interface HRSettingsFormProps {
  canManageSettings: boolean;
  hasFullAccess: boolean;
}

export default function HRSettingsForm({
  canManageSettings,
  hasFullAccess,
}: HRSettingsFormProps) {
  const router = useRouter();
  const [hrSettings, setHrSettings] = useState<HRSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<HRSettingsSchemaType>({
    resolver: zodResolver(HRSettingsSchema),
    defaultValues: {
      workingHoursPerDay: 8,
      paymentDay: 25,
      paymentMonth: "CURRENT",
      autoProcessPayroll: false,
      workingDaysPerMonth: 22,
      lateThreshold: 15,
      halfDayThreshold: 4,
      overtimeThreshold: 8,
      overtimeHourRate: 50,
      annualLeaveDays: 21,
      sickLeaveDays: 30,
      studyLeaveDays: 5,
      maternityLeaveDays: 120,
      paternityLeaveDays: 10,
      carryOverEnabled: true,
      maxCarryOverDays: 5,
    },
  });

  const { isSubmitting } = form.formState;

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/hr");
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch HR settings", error);
      return null;
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await fetchSettings();
        setHrSettings(settings);

        if (settings) {
          form.reset({
            workingHoursPerDay: settings.workingHoursPerDay,
            paymentDay: settings.paymentDay,
            paymentMonth: settings.paymentMonth || "CURRENT",
            autoProcessPayroll: settings.autoProcessPayroll,
            workingDaysPerMonth: settings.workingDaysPerMonth,
            lateThreshold: settings.lateThreshold,
            halfDayThreshold: settings.halfDayThreshold,
            overtimeThreshold: settings.overtimeThreshold,
            overtimeHourRate: settings.overtimeHourRate,
            annualLeaveDays: settings.annualLeaveDays,
            sickLeaveDays: settings.sickLeaveDays,
            studyLeaveDays: settings.studyLeaveDays,
            maternityLeaveDays: settings.maternityLeaveDays,
            paternityLeaveDays: settings.paternityLeaveDays,
            carryOverEnabled: settings.carryOverEnabled,
            maxCarryOverDays: settings.maxCarryOverDays,
          });
        }
      } catch (error) {
        console.error("Error loading HR settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form]);

  const onSubmit = async (values: HRSettingsSchemaType) => {
    try {
      await axios.post("/api/settings/hr", values);
      toast.success(
        hrSettings
          ? "HR settings updated successfully"
          : "HR settings saved successfully"
      );
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (loading) {
    return <GeneralSettingsFormLoading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {hrSettings ? "HR Settings" : "Setup HR Settings"}
        </CardTitle>
        <CardDescription>
          {hrSettings
            ? "Manage your HR settings including payroll, attendance, and leave policies."
            : "Configure your HR settings to get started with payroll and attendance management."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 p-6"
          >
            {/* Company Settings - Remove company name and currency */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Work Hours Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workingHoursPerDay"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Working Hours Per Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingDaysPerMonth"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Working Days Per Month</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Payroll Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Payroll Settings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDay"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Payment Day</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value.toString()}
                        disabled={!hasFullAccess && !canManageSettings}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMonth"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Payment Month</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!hasFullAccess && !canManageSettings}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CURRENT">Current Month</SelectItem>
                          <SelectItem value="FOLLOWING">
                            Following Month
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overtimeHourRate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Overtime Hour Rate (ZAR)</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        className="w-full"
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="autoProcessPayroll"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto Process Payroll
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Automatically process payroll on payment day
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Attendance Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Attendance Settings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="lateThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Late Threshold (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="halfDayThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Half Day Threshold (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overtimeThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Overtime Threshold (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Leave Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Leave Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualLeaveDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Annual Leave Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sickLeaveDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Sick Leave Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studyLeaveDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Study Leave Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maternityLeaveDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Maternity Leave Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paternityLeaveDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Paternity Leave Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxCarryOverDays"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Max Carry Over Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="carryOverEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Leave Carry Over
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow employees to carry over unused leave days
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              {(hasFullAccess || canManageSettings) && (
                <Button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : hrSettings ? (
                    "Update Settings"
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
