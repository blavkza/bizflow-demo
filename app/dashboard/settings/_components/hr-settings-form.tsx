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
import { Settings2, Loader2, HelpCircle } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GeneralSettingsFormLoading } from "./GeneralSettingsFormLoading";

// Validation Schema
const HRSettingsSchema = z.object({
  // Payroll Settings
  paymentDay: z.number().min(1).max(31),
  paymentMonth: z.string(),
  autoProcessPayroll: z.boolean(),
  workingDaysPerMonth: z.number().min(1).max(31),
  overtimeHourRate: z.number().min(0),
  callOutHourlyRate: z.number().min(0),
  useCallOutHourlyRate: z.boolean(),

  // Attendance Settings
  workingHoursPerDay: z.number().min(1).max(24),
  workingHoursWeekend: z.number().min(1).max(24),
  lateThreshold: z.number().min(1),
  halfDayThreshold: z.number().min(0.5),
  overtimeThreshold: z.number().min(1),
  WeekendovertimeThreshold: z.number().min(1),

  // Break Settings
  maxBreaksPerDay: z.number().min(0).max(2),
  totalBreakDurationMinutes: z.number().min(0).max(480),
  breakReminderMinutes: z.number().min(0).max(60),
  teaTimeWindowStart: z.string().optional(),
  teaTimeWindowEnd: z.string().optional(),
  lunchTimeWindowStart: z.string().optional(),
  lunchTimeWindowEnd: z.string().optional(),

  // Leave Settings
  annualLeaveDays: z.number().min(0),
  sickLeaveDays: z.number().min(0),
  studyLeaveDays: z.number().min(0),
  maternityLeaveDays: z.number().min(0),
  paternityLeaveDays: z.number().min(0),
  carryOverEnabled: z.boolean(),
  maxCarryOverDays: z.number().min(0),

  // Bonus Settings
  annualBonusEnabled: z.boolean(),
  annualBonusType: z.enum(["DECEMBER", "BIRTH_MONTH"]),
  annualBonusPercentage: z.number().min(0).max(500),

  performanceBonusEnabled: z.boolean(),
  performanceBonusType: z.enum(["INDIVIDUAL", "TEAM"]),
  performanceBonusPercentage: z.number().min(0).max(100),

  profitSharingEnabled: z.boolean(),
  profitSharingPercentage: z.number().min(0).max(100),

  thirteenthChequeEnabled: z.boolean(),

  spotBonusEnabled: z.boolean(),
  spotBonusAmount: z.number().min(0),

  meritBonusEnabled: z.boolean(),
  meritBonusPercentage: z.number().min(0).max(100),

  appreciationBonusEnabled: z.boolean(),
  appreciationBonusAmount: z.number().min(0),

  incentivePaymentEnabled: z.boolean(),
  incentivePaymentPercentage: z.number().min(0).max(100),

  recognitionAwardEnabled: z.boolean(),
  recognitionAwardAmount: z.number().min(0),

  attendanceBonusEnabled: z.boolean(),
  attendanceBonusPercentage: z.number().min(0).max(100),

  overtimeBonusEnabled: z.boolean(),
  overtimeBonusPercentage: z.number().min(0).max(100),

  // Deduction Settings
  uniformPPEEnabled: z.boolean(),
  uniformPPEMaxDeduction: z.number().min(0),

  damageLossEnabled: z.boolean(),
  damageLossMaxPercentage: z.number().min(0).max(100),

  uifEnabled: z.boolean(),
  uifPercentage: z.number().min(0).max(10),

  pensionEnabled: z.boolean(),
  pensionPercentage: z.number().min(0).max(50),

  medicalAidEnabled: z.boolean(),
  medicalAidMaxDeduction: z.number().min(0),

  taxEnabled: z.boolean(),
  taxTableYear: z.string(),

  overpaymentEnabled: z.boolean(),
  overpaymentMaxPercentage: z.number().min(0).max(100),

  loanRepaymentEnabled: z.boolean(),

  funeralBenefitEnabled: z.boolean(),
  funeralBenefitAmount: z.number().min(0),

  tradeUnionEnabled: z.boolean(),
  tradeUnionAmount: z.number().min(0),

  insuranceEnabled: z.boolean(),
  insurancePercentage: z.number().min(0).max(100),

  guaranteeFundEnabled: z.boolean(),
  guaranteeFundAmount: z.number().min(0),

  savingsEnabled: z.boolean(),
  savingsMaxPercentage: z.number().min(0).max(100),

  disciplinaryEnabled: z.boolean(),
  disciplinaryMaxPercentage: z.number().min(0).max(100),

  courtOrderEnabled: z.boolean(),
});

type HRSettingsSchemaType = z.infer<typeof HRSettingsSchema>;

interface HRSettings {
  id: string;
  workingHoursPerDay: number;
  workingHoursWeekend: number;
  paymentDay: number;
  paymentMonth: string;
  overtimeHourRate: number;
  callOutHourlyRate: number;
  useCallOutHourlyRate: boolean;
  autoProcessPayroll: boolean;
  workingDaysPerMonth: number;
  lateThreshold: number;
  halfDayThreshold: number;
  overtimeThreshold: number;
  WeekendovertimeThreshold: number;
  maxBreaksPerDay: number;
  totalBreakDurationMinutes: number;
  breakReminderMinutes: number;
  teaTimeWindowStart?: string;
  teaTimeWindowEnd?: string;
  lunchTimeWindowStart?: string;
  lunchTimeWindowEnd?: string;
  annualLeaveDays: number;
  sickLeaveDays: number;
  studyLeaveDays: number;
  maternityLeaveDays: number;
  paternityLeaveDays: number;
  carryOverEnabled: boolean;
  maxCarryOverDays: number;

  // Bonus Settings
  annualBonusEnabled: boolean;
  annualBonusType: string;
  annualBonusPercentage: number;
  performanceBonusEnabled: boolean;
  performanceBonusType: string;
  performanceBonusPercentage: number;
  profitSharingEnabled: boolean;
  profitSharingPercentage: number;
  thirteenthChequeEnabled: boolean;
  spotBonusEnabled: boolean;
  spotBonusAmount: number;
  meritBonusEnabled: boolean;
  meritBonusPercentage: number;
  appreciationBonusEnabled: boolean;
  appreciationBonusAmount: number;
  incentivePaymentEnabled: boolean;
  incentivePaymentPercentage: number;
  recognitionAwardEnabled: boolean;
  recognitionAwardAmount: number;
  attendanceBonusEnabled: boolean;
  attendanceBonusPercentage: number;
  overtimeBonusEnabled: boolean;
  overtimeBonusPercentage: number;

  // Deduction Settings
  uniformPPEEnabled: boolean;
  uniformPPEMaxDeduction: number;
  damageLossEnabled: boolean;
  damageLossMaxPercentage: number;
  uifEnabled: boolean;
  uifPercentage: number;
  pensionEnabled: boolean;
  pensionPercentage: number;
  medicalAidEnabled: boolean;
  medicalAidMaxDeduction: number;
  taxEnabled: boolean;
  taxTableYear: string;
  overpaymentEnabled: boolean;
  overpaymentMaxPercentage: number;
  loanRepaymentEnabled: boolean;
  funeralBenefitEnabled: boolean;
  funeralBenefitAmount: number;
  tradeUnionEnabled: boolean;
  tradeUnionAmount: number;
  insuranceEnabled: boolean;
  insurancePercentage: number;
  guaranteeFundEnabled: boolean;
  guaranteeFundAmount: number;
  savingsEnabled: boolean;
  savingsMaxPercentage: number;
  disciplinaryEnabled: boolean;
  disciplinaryMaxPercentage: number;
  courtOrderEnabled: boolean;
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
      // Existing defaults
      workingHoursPerDay: 8,
      workingHoursWeekend: 4,
      paymentDay: 25,
      paymentMonth: "CURRENT",
      autoProcessPayroll: false,
      workingDaysPerMonth: 22,
      lateThreshold: 15,
      halfDayThreshold: 4,
      overtimeThreshold: 8,
      WeekendovertimeThreshold: 4,
      overtimeHourRate: 50,
      callOutHourlyRate: 0,
      useCallOutHourlyRate: false,
      maxBreaksPerDay: 2,
      totalBreakDurationMinutes: 60,
      breakReminderMinutes: 5,
      teaTimeWindowStart: "10:00",
      teaTimeWindowEnd: "11:00",
      lunchTimeWindowStart: "13:00",
      lunchTimeWindowEnd: "14:00",
      annualLeaveDays: 21,
      sickLeaveDays: 30,
      studyLeaveDays: 5,
      maternityLeaveDays: 120,
      paternityLeaveDays: 10,
      carryOverEnabled: true,
      maxCarryOverDays: 5,

      // Bonus Settings Defaults
      annualBonusEnabled: true,
      annualBonusType: "DECEMBER",
      annualBonusPercentage: 100,
      performanceBonusEnabled: true,
      performanceBonusType: "INDIVIDUAL",
      performanceBonusPercentage: 5,
      profitSharingEnabled: false,
      profitSharingPercentage: 10,
      thirteenthChequeEnabled: false,
      spotBonusEnabled: true,
      spotBonusAmount: 500,
      meritBonusEnabled: true,
      meritBonusPercentage: 3,
      appreciationBonusEnabled: true,
      appreciationBonusAmount: 250,
      incentivePaymentEnabled: true,
      incentivePaymentPercentage: 4,
      recognitionAwardEnabled: true,
      recognitionAwardAmount: 300,
      attendanceBonusEnabled: true,
      attendanceBonusPercentage: 2,
      overtimeBonusEnabled: true,
      overtimeBonusPercentage: 10,

      // Deduction Settings Defaults
      uniformPPEEnabled: true,
      uniformPPEMaxDeduction: 500,
      damageLossEnabled: true,
      damageLossMaxPercentage: 20,
      uifEnabled: true,
      uifPercentage: 1,
      pensionEnabled: true,
      pensionPercentage: 7.5,
      medicalAidEnabled: true,
      medicalAidMaxDeduction: 2000,
      taxEnabled: true,
      taxTableYear: "2024",
      overpaymentEnabled: true,
      overpaymentMaxPercentage: 25,
      loanRepaymentEnabled: true,
      funeralBenefitEnabled: true,
      funeralBenefitAmount: 100,
      tradeUnionEnabled: false,
      tradeUnionAmount: 50,
      insuranceEnabled: true,
      insurancePercentage: 0.5,
      guaranteeFundEnabled: false,
      guaranteeFundAmount: 20,
      savingsEnabled: true,
      savingsMaxPercentage: 15,
      disciplinaryEnabled: true,
      disciplinaryMaxPercentage: 25,
      courtOrderEnabled: true,
    },
  });

  const maxBreaks = form.watch("maxBreaksPerDay");

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
            // Existing settings
            workingHoursPerDay: settings.workingHoursPerDay,
            workingHoursWeekend: settings.workingHoursWeekend,
            paymentDay: settings.paymentDay,
            paymentMonth: settings.paymentMonth || "CURRENT",
            autoProcessPayroll: settings.autoProcessPayroll,
            workingDaysPerMonth: settings.workingDaysPerMonth,
            lateThreshold: settings.lateThreshold,
            halfDayThreshold: settings.halfDayThreshold,
            overtimeThreshold: settings.overtimeThreshold,
            WeekendovertimeThreshold: settings.WeekendovertimeThreshold,
            overtimeHourRate: settings.overtimeHourRate,
            callOutHourlyRate: settings.callOutHourlyRate || 0,
            useCallOutHourlyRate: settings.useCallOutHourlyRate || false,
            maxBreaksPerDay: settings.maxBreaksPerDay ?? 2,
            totalBreakDurationMinutes: settings.totalBreakDurationMinutes ?? 60,
            breakReminderMinutes: settings.breakReminderMinutes ?? 5,
            teaTimeWindowStart: settings.teaTimeWindowStart ?? "10:00",
            teaTimeWindowEnd: settings.teaTimeWindowEnd ?? "11:00",
            lunchTimeWindowStart: settings.lunchTimeWindowStart ?? "13:00",
            lunchTimeWindowEnd: settings.lunchTimeWindowEnd ?? "14:00",
            annualLeaveDays: settings.annualLeaveDays,
            sickLeaveDays: settings.sickLeaveDays,
            studyLeaveDays: settings.studyLeaveDays,
            maternityLeaveDays: settings.maternityLeaveDays,
            paternityLeaveDays: settings.paternityLeaveDays,
            carryOverEnabled: settings.carryOverEnabled,
            maxCarryOverDays: settings.maxCarryOverDays,

            // Bonus Settings
            annualBonusEnabled: settings.annualBonusEnabled ?? true,
            annualBonusType: settings.annualBonusType || "DECEMBER",
            annualBonusPercentage: settings.annualBonusPercentage ?? 100,
            performanceBonusEnabled: settings.performanceBonusEnabled ?? true,
            performanceBonusType: settings.performanceBonusType || "INDIVIDUAL",
            performanceBonusPercentage:
              settings.performanceBonusPercentage ?? 5,
            profitSharingEnabled: settings.profitSharingEnabled ?? false,
            profitSharingPercentage: settings.profitSharingPercentage ?? 10,
            thirteenthChequeEnabled: settings.thirteenthChequeEnabled ?? false,
            spotBonusEnabled: settings.spotBonusEnabled ?? true,
            spotBonusAmount: settings.spotBonusAmount ?? 500,
            meritBonusEnabled: settings.meritBonusEnabled ?? true,
            meritBonusPercentage: settings.meritBonusPercentage ?? 3,
            appreciationBonusEnabled: settings.appreciationBonusEnabled ?? true,
            appreciationBonusAmount: settings.appreciationBonusAmount ?? 250,
            incentivePaymentEnabled: settings.incentivePaymentEnabled ?? true,
            incentivePaymentPercentage:
              settings.incentivePaymentPercentage ?? 4,
            recognitionAwardEnabled: settings.recognitionAwardEnabled ?? true,
            recognitionAwardAmount: settings.recognitionAwardAmount ?? 300,
            attendanceBonusEnabled: settings.attendanceBonusEnabled ?? true,
            attendanceBonusPercentage: settings.attendanceBonusPercentage ?? 2,
            overtimeBonusEnabled: settings.overtimeBonusEnabled ?? true,
            overtimeBonusPercentage: settings.overtimeBonusPercentage ?? 10,

            // Deduction Settings
            uniformPPEEnabled: settings.uniformPPEEnabled ?? true,
            uniformPPEMaxDeduction: settings.uniformPPEMaxDeduction ?? 500,
            damageLossEnabled: settings.damageLossEnabled ?? true,
            damageLossMaxPercentage: settings.damageLossMaxPercentage ?? 20,
            uifEnabled: settings.uifEnabled ?? true,
            uifPercentage: settings.uifPercentage ?? 1,
            pensionEnabled: settings.pensionEnabled ?? true,
            pensionPercentage: settings.pensionPercentage ?? 7.5,
            medicalAidEnabled: settings.medicalAidEnabled ?? true,
            medicalAidMaxDeduction: settings.medicalAidMaxDeduction ?? 2000,
            taxEnabled: settings.taxEnabled ?? true,
            taxTableYear: settings.taxTableYear || "2024",
            overpaymentEnabled: settings.overpaymentEnabled ?? true,
            overpaymentMaxPercentage: settings.overpaymentMaxPercentage ?? 25,
            loanRepaymentEnabled: settings.loanRepaymentEnabled ?? true,
            funeralBenefitEnabled: settings.funeralBenefitEnabled ?? true,
            funeralBenefitAmount: settings.funeralBenefitAmount ?? 100,
            tradeUnionEnabled: settings.tradeUnionEnabled ?? false,
            tradeUnionAmount: settings.tradeUnionAmount ?? 50,
            insuranceEnabled: settings.insuranceEnabled ?? true,
            insurancePercentage: settings.insurancePercentage ?? 0.5,
            guaranteeFundEnabled: settings.guaranteeFundEnabled ?? false,
            guaranteeFundAmount: settings.guaranteeFundAmount ?? 20,
            savingsEnabled: settings.savingsEnabled ?? true,
            savingsMaxPercentage: settings.savingsMaxPercentage ?? 15,
            disciplinaryEnabled: settings.disciplinaryEnabled ?? true,
            disciplinaryMaxPercentage: settings.disciplinaryMaxPercentage ?? 50,
            courtOrderEnabled: settings.courtOrderEnabled ?? true,
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
          : "HR settings saved successfully",
      );
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  // Helper component for explanation popovers
  const ExplanationPopover = ({
    title,
    content,
    side = "right",
  }: {
    title: string;
    content: string;
    side?: "top" | "right" | "bottom" | "left";
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 ml-1"
          type="button"
        >
          <HelpCircle className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side={side} align="start">
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground">{content}</p>
      </PopoverContent>
    </Popover>
  );

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
            ? "Manage your HR settings including payroll, attendance, leave policies, bonuses, and deductions."
            : "Configure your HR settings to get started with payroll and attendance management."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-8 p-6"
          >
            {/* Work Hours Settings */}
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
                      <div className="flex items-center">
                        <FormLabel>Working Hours Per Day</FormLabel>
                        <ExplanationPopover
                          title="Working Hours Per Day"
                          content="The standard number of hours an employee is expected to work each day. This is used to calculate overtime and determine full-day attendance."
                        />
                      </div>
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
                  name="workingHoursWeekend"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>Working Hours On Weekend</FormLabel>
                        <ExplanationPopover
                          title="Working Hours On Weeked "
                          content="The standard number of hours an employee is expected on weeekend days. This is used to calculate overtime and determine full-day attendance."
                        />
                      </div>
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
              </div>
              <FormField
                control={form.control}
                name="workingDaysPerMonth"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center">
                      <FormLabel>Working Days Per Month</FormLabel>
                      <ExplanationPopover
                        title="Working Days Per Month"
                        content="The standard number of working days in a month. Used for calculating monthly salary and leave accruals."
                      />
                    </div>
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
                      <div className="flex items-center">
                        <FormLabel>Payment Day</FormLabel>
                        <ExplanationPopover
                          title="Payment Day"
                          content="The day of the month when employees receive their salary. Choose from 1st to 31st."
                        />
                      </div>
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
                            ),
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
                      <div className="flex items-center">
                        <FormLabel>Payment Month</FormLabel>
                        <ExplanationPopover
                          title="Payment Month"
                          content="CURRENT: Pay for current month's work. FOLLOWING: Pay for previous month's work (common practice)."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Overtime Hour Rate (ZAR)</FormLabel>
                        <ExplanationPopover
                          title="Overtime Hour Rate"
                          content="The hourly rate paid for overtime work. Typically higher than regular hourly rate."
                        />
                      </div>
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

                <FormField
                  control={form.control}
                  name="callOutHourlyRate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>Call-Out Hour Rate (ZAR)</FormLabel>
                        <ExplanationPopover
                          title="Call-Out Hour Rate"
                          content="Global hourly rate for emergency call-outs. If disabled, worker's individual overtime rate is used."
                        />
                      </div>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="useCallOutHourlyRate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <FormLabel className="text-base">
                            Use Global Call-Out Rate
                          </FormLabel>
                          <ExplanationPopover
                            title="Use Global Call-Out Rate"
                            content="When enabled, the Global Call-Out Rate above will be used for all workers. When disabled, their individual overtime rate will be used."
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Toggle between global rate and individual worker rate
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

              <FormField
                control={form.control}
                name="autoProcessPayroll"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <FormLabel className="text-base">
                          Auto Process Payroll
                        </FormLabel>
                        <ExplanationPopover
                          title="Auto Process Payroll"
                          content="When enabled, payroll will be processed automatically on the specified payment day."
                        />
                      </div>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lateThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>Late Threshold (minutes)</FormLabel>
                        <ExplanationPopover
                          title="Late Threshold"
                          content="Maximum minutes an employee can arrive after scheduled start time before being marked as late."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>
                          Half Day Threshold On Week Days(hours)
                        </FormLabel>
                        <ExplanationPopover
                          title="Half Day Threshold"
                          content="Minimum hours required to be considered a half day of work on week days. Less than this may be considered absent."
                        />
                      </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="overtimeThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>
                          Week days Overtime Threshold (hours)
                        </FormLabel>
                        <ExplanationPopover
                          title="Overtime Threshold"
                          content="Week days daily hours worked beyond this threshold qualify for overtime pay."
                        />
                      </div>
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
                <FormField
                  control={form.control}
                  name="WeekendovertimeThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>
                          {" "}
                          Weekend Overtime Threshold (hours)
                        </FormLabel>
                        <ExplanationPopover
                          title="Overtime Threshold"
                          content="Weekend daily hours worked beyond this threshold qualify for overtime pay."
                        />
                      </div>
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

              {/* Break Settings Section */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">Break Settings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxBreaksPerDay"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Max Breaks Per Day</FormLabel>
                          <ExplanationPopover
                            title="Max Breaks Per Day"
                            content="The maximum number of separate breaks an employee can take in a single shift."
                          />
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="2"
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
                    name="totalBreakDurationMinutes"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Total Break Duration (min)</FormLabel>
                          <ExplanationPopover
                            title="Total Break Duration"
                            content="The total allowed break time per day in minutes. This can be split across multiple breaks."
                          />
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="480"
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
                    name="breakReminderMinutes"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Reminder Before End (min)</FormLabel>
                          <ExplanationPopover
                            title="Break Reminder"
                            content="The system will notify the employee this many minutes before their total break time is exhausted."
                          />
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="60"
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="teaTimeWindowStart"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Tea Time Window Start</FormLabel>
                          <ExplanationPopover
                            title="Tea Time Window Start"
                            content="The earliest time employees can start their tea time break."
                          />
                        </div>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
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
                    name="teaTimeWindowEnd"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Tea Time Window End</FormLabel>
                          <ExplanationPopover
                            title="Tea Time Window End"
                            content="The latest time employees can be on their tea time break."
                          />
                        </div>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="w-full"
                            disabled={!hasFullAccess && !canManageSettings}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {maxBreaks >= 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lunchTimeWindowStart"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center">
                            <FormLabel>Lunch Time Window Start</FormLabel>
                            <ExplanationPopover
                              title="Lunch Time Window Start"
                              content="The earliest time employees can start their lunch break."
                            />
                          </div>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
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
                      name="lunchTimeWindowEnd"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center">
                            <FormLabel>Lunch Time Window End</FormLabel>
                            <ExplanationPopover
                              title="Lunch Time Window End"
                              content="The latest time employees can be on their lunch break."
                            />
                          </div>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-full"
                              disabled={!hasFullAccess && !canManageSettings}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
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
                      <div className="flex items-center">
                        <FormLabel>Annual Leave Days</FormLabel>
                        <ExplanationPopover
                          title="Annual Leave Days"
                          content="Paid vacation days employees earn per year. Also known as vacation leave."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Sick Leave Days</FormLabel>
                        <ExplanationPopover
                          title="Sick Leave Days"
                          content="Paid days off for illness or medical appointments per year."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Study Leave Days</FormLabel>
                        <ExplanationPopover
                          title="Study Leave Days"
                          content="Paid days off for educational purposes or exams per year."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Maternity Leave Days</FormLabel>
                        <ExplanationPopover
                          title="Maternity Leave Days"
                          content="Paid leave for pregnancy and childbirth. Usually 4 months as per South African law."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Paternity Leave Days</FormLabel>
                        <ExplanationPopover
                          title="Paternity Leave Days"
                          content="Paid leave for new fathers after childbirth."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel>Max Carry Over Days</FormLabel>
                        <ExplanationPopover
                          title="Max Carry Over Days"
                          content="Maximum unused annual leave days that can be carried over to the next year."
                        />
                      </div>
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
                      <div className="flex items-center">
                        <FormLabel className="text-base">
                          Leave Carry Over
                        </FormLabel>
                        <ExplanationPopover
                          title="Leave Carry Over"
                          content="Allow employees to carry unused annual leave days to the next year, up to the maximum limit."
                        />
                      </div>
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

            {/* Bonus Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Bonus Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Annual Bonus */}
                <div className="col-span-2 space-y-2">
                  <FormField
                    control={form.control}
                    name="annualBonusEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-base">
                              Annual Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Annual Bonus"
                              content="Year-end bonus equal to a percentage of basic salary. Can be paid in December or during employee's birth month."
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Percentage of basic salary
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
                  {form.watch("annualBonusEnabled") && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name="annualBonusType"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Annual Bonus Payment</FormLabel>
                              <ExplanationPopover
                                title="Annual Bonus Timing"
                                content="Choose when the annual bonus is paid."
                              />
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!hasFullAccess && !canManageSettings}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DECEMBER">
                                  December (13th Cheque)
                                </SelectItem>
                                <SelectItem value="BIRTH_MONTH">
                                  Employee Birth Month
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="annualBonusPercentage"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Bonus Percentage (%)</FormLabel>
                              <ExplanationPopover
                                title="Annual Bonus Percentage"
                                content="Percentage of monthly salary to pay as bonus (e.g., 100% is a full double cheque)."
                              />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="500"
                                step="0.1"
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
                  )}
                </div>

                {/* Performance Bonus */}
                <div className="col-span-2 space-y-2 border p-3 rounded-lg">
                  <FormField
                    control={form.control}
                    name="performanceBonusEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-base">
                              Performance Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Performance Bonus"
                              content="Bonus based on individual or team performance targets."
                            />
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
                  {form.watch("performanceBonusEnabled") && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name="performanceBonusType"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!hasFullAccess && !canManageSettings}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INDIVIDUAL">
                                  Individual
                                </SelectItem>
                                <SelectItem value="TEAM">Team</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="performanceBonusPercentage"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Bonus Percentage (%)</FormLabel>
                              <ExplanationPopover
                                title="Performance Bonus Percentage"
                                content="Default percentage of salary for meeting performance goals."
                              />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Profit Sharing */}
                <div className="col-span-2 space-y-2 border p-3 rounded-lg">
                  <FormField
                    control={form.control}
                    name="profitSharingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-base">
                              Profit Sharing Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Profit Sharing Bonus"
                              content="Bonus distributed based on company profitability."
                            />
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
                  {form.watch("profitSharingEnabled") && (
                    <div className="mt-2">
                      <FormField
                        control={form.control}
                        name="profitSharingPercentage"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Profit Sharing %</FormLabel>
                              <ExplanationPopover
                                title="Profit Sharing Percentage"
                                content="Percentage of profits allocated to this bonus pool."
                              />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
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
                  )}
                </div>

                {/* 13th Cheque */}
                <FormField
                  control={form.control}
                  name="thirteenthChequeEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <FormLabel className="text-base">
                            13th Cheque
                          </FormLabel>
                          <ExplanationPopover
                            title="13th Cheque"
                            content="Additional month's salary paid in December."
                          />
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

                {/* Dynamic Bonus Section Grid */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  {/* Spot Bonus */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="spotBonusEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Spot Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Spot Bonus"
                              content="Instant reward for specific achievements or exceptional effort."
                            />
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
                    {form.watch("spotBonusEnabled") && (
                      <FormField
                        control={form.control}
                        name="spotBonusAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Amount (ZAR)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Merit Bonus */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="meritBonusEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Merit Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Merit Bonus"
                              content="Performance-based reward for sustained excellence and skills."
                            />
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
                    {form.watch("meritBonusEnabled") && (
                      <FormField
                        control={form.control}
                        name="meritBonusPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Percentage (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Appreciation Bonus */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="appreciationBonusEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Appreciation Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Appreciation Bonus"
                              content="Token of gratitude for loyalty, hard work, or tenure."
                            />
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
                    {form.watch("appreciationBonusEnabled") && (
                      <FormField
                        control={form.control}
                        name="appreciationBonusAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Amount (ZAR)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Incentive Payment */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="incentivePaymentEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Incentive Payment
                            </FormLabel>
                            <ExplanationPopover
                              title="Incentive Payment"
                              content="Target-driven payment for meeting specific goals or quotas."
                            />
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
                    {form.watch("incentivePaymentEnabled") && (
                      <FormField
                        control={form.control}
                        name="incentivePaymentPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Percentage (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Recognition Award */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="recognitionAwardEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Recognition Award
                            </FormLabel>
                            <ExplanationPopover
                              title="Recognition Award"
                              content="Formal award for milestones, innovation, or company values."
                            />
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
                    {form.watch("recognitionAwardEnabled") && (
                      <FormField
                        control={form.control}
                        name="recognitionAwardAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Amount (ZAR)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Attendance Bonus */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="attendanceBonusEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Attendance Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Attendance Bonus"
                              content="Reward for perfect or near-perfect attendance records."
                            />
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
                    {form.watch("attendanceBonusEnabled") && (
                      <FormField
                        control={form.control}
                        name="attendanceBonusPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Percentage (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Overtime Bonus */}
                  <div className="border p-3 rounded-lg space-y-2">
                    <FormField
                      control={form.control}
                      name="overtimeBonusEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="flex items-center">
                            <FormLabel className="text-sm font-medium">
                              Overtime Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Overtime Bonus"
                              content="Additional bonus percentage on top of standard overtime rates."
                            />
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
                    {form.watch("overtimeBonusEnabled") && (
                      <FormField
                        control={form.control}
                        name="overtimeBonusPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Percentage (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Deduction Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Deduction Settings
              </h3>

              {/* Tax Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Tax Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">PAYE Tax</FormLabel>
                            <ExplanationPopover
                              title="PAYE Tax"
                              content="Enable automatic PAYE tax calculations based on SARS tax tables."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Enable automatic tax calculations
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
                  {form.watch("taxEnabled") && (
                    <FormField
                      control={form.control}
                      name="taxTableYear"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Tax Year Table</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!hasFullAccess && !canManageSettings}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2024">
                                2024 (Mar 23 - Feb 24)
                              </SelectItem>
                              <SelectItem value="2025">
                                2025 (Mar 24 - Feb 25)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Mandatory Deductions */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Mandatory Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="uifEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">UIF</FormLabel>
                                <ExplanationPopover
                                  title="UIF"
                                  content="Unemployment Insurance Fund contributions."
                                />
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
                      {form.watch("uifEnabled") && (
                        <FormField
                          control={form.control}
                          name="uifPercentage"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>UIF %</FormLabel>
                                <ExplanationPopover
                                  title="UIF Percentage"
                                  content="Employee contribution percentage (standard is 1%)."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Insurance & Benefits */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Insurance & Benefits
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pension */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pensionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Pension Fund
                                </FormLabel>
                                <ExplanationPopover
                                  title="Pension Fund"
                                  content="Retirement savings plan contributions."
                                />
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
                      {form.watch("pensionEnabled") && (
                        <FormField
                          control={form.control}
                          name="pensionPercentage"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Pension %</FormLabel>
                                <ExplanationPopover
                                  title="Pension Percentage"
                                  content="Percentage of salary contributed to pension."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Medical Aid */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medicalAidEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Medical Aid
                                </FormLabel>
                                <ExplanationPopover
                                  title="Medical Aid"
                                  content="Employee health insurance contributions."
                                />
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
                      {form.watch("medicalAidEnabled") && (
                        <FormField
                          control={form.control}
                          name="medicalAidMaxDeduction"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Max Deduction (ZAR)</FormLabel>
                                <ExplanationPopover
                                  title="Medical Aid Max"
                                  content="Maximum allowed monthly deduction for medical aid."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Insurance - Updated with Percentage Input */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="insuranceEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Insurance
                                </FormLabel>
                                <ExplanationPopover
                                  title="Insurance"
                                  content="Deductions for group life, disability, or other insurance policies."
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Life/disability
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
                      {form.watch("insuranceEnabled") && (
                        <FormField
                          control={form.control}
                          name="insurancePercentage"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Insurance %</FormLabel>
                                <ExplanationPopover
                                  title="Insurance Percentage"
                                  content="Percentage of salary deducted for insurance."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Property Deductions */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Company Property
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="uniformPPEEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Uniform/PPE
                                </FormLabel>
                                <ExplanationPopover
                                  title="Uniform/PPE"
                                  content="Deductions for uniforms or personal protective equipment."
                                />
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
                      {form.watch("uniformPPEEnabled") && (
                        <FormField
                          control={form.control}
                          name="uniformPPEMaxDeduction"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Max Amount (ZAR)</FormLabel>
                                <ExplanationPopover
                                  title="Uniform Max Deduction"
                                  content="Maximum allowed deduction for uniforms/PPE."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="damageLossEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Damage/Loss
                                </FormLabel>
                                <ExplanationPopover
                                  title="Damage/Loss"
                                  content="Deductions for damages to company property."
                                />
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
                      {form.watch("damageLossEnabled") && (
                        <FormField
                          control={form.control}
                          name="damageLossMaxPercentage"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Max % of Salary</FormLabel>
                                <ExplanationPopover
                                  title="Damage Max Percentage"
                                  content="Maximum percentage of salary deductible for damages."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                  disabled={
                                    !hasFullAccess && !canManageSettings
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Deductions (Trade Union, Guarantee Fund, etc) */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Other Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Trade Union - Updated with Amount Input */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tradeUnionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Trade Union
                                </FormLabel>
                                <ExplanationPopover
                                  title="Trade Union"
                                  content="Deduction for union membership fees."
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Membership fees
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
                      {form.watch("tradeUnionEnabled") && (
                        <FormField
                          control={form.control}
                          name="tradeUnionAmount"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Amount (ZAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Guarantee Fund - Updated with Amount Input */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="guaranteeFundEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Guarantee Fund
                                </FormLabel>
                                <ExplanationPopover
                                  title="Guarantee Fund"
                                  content="Insurance fund deduction for employees handling cash."
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Cash handling
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
                      {form.watch("guaranteeFundEnabled") && (
                        <FormField
                          control={form.control}
                          name="guaranteeFundAmount"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Amount (ZAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Funeral Benefit */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="funeralBenefitEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Funeral Benefit
                                </FormLabel>
                                <ExplanationPopover
                                  title="Funeral Benefit"
                                  content="Contribution for funeral coverage."
                                />
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
                      {form.watch("funeralBenefitEnabled") && (
                        <FormField
                          control={form.control}
                          name="funeralBenefitAmount"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Amount (ZAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Savings Scheme */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="savingsEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <FormLabel className="text-sm">
                                  Savings
                                </FormLabel>
                                <ExplanationPopover
                                  title="Savings Scheme"
                                  content="Voluntary savings or stokvel deductions."
                                />
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
                      {form.watch("savingsEnabled") && (
                        <FormField
                          control={form.control}
                          name="savingsMaxPercentage"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <div className="flex items-center">
                                <FormLabel>Max % of Salary</FormLabel>
                                <ExplanationPopover
                                  title="Savings Max"
                                  content="Maximum percentage of salary allowed for savings."
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                  className="w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Simple Switches (No extra input needed based on UI design) */}
                    <FormField
                      control={form.control}
                      name="overpaymentEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Overpayment Recovery
                              </FormLabel>
                              <ExplanationPopover
                                title="Overpayment Recovery"
                                content="Deductions to recover salary overpayments."
                              />
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
                    {form.watch("overpaymentEnabled") && (
                      <FormField
                        control={form.control}
                        name="overpaymentMaxPercentage"
                        render={({ field }) => (
                          <FormItem className="space-y-2 col-span-2">
                            <div className="flex items-center">
                              <FormLabel>Max Recovery % per Pay</FormLabel>
                              <ExplanationPopover
                                title="Overpayment Max"
                                content="Maximum percentage of salary deductible for overpayment recovery."
                              />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                className="w-full"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="loanRepaymentEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Loan Repayment
                              </FormLabel>
                              <ExplanationPopover
                                title="Loan Repayment"
                                content="Deductions for company loan repayments."
                              />
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

                    <FormField
                      control={form.control}
                      name="disciplinaryEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Disciplinary Action
                              </FormLabel>
                              <ExplanationPopover
                                title="Disciplinary Action"
                                content="Deductions resulting from disciplinary hearings (e.g. unpaid suspension)."
                              />
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
                    {form.watch("disciplinaryEnabled") && (
                      <FormField
                        control={form.control}
                        name="disciplinaryMaxPercentage"
                        render={({ field }) => (
                          <FormItem className="space-y-2 col-span-2">
                            <div className="flex items-center">
                              <FormLabel>Max Disciplinary %</FormLabel>
                              <ExplanationPopover
                                title="Disciplinary Max"
                                content="Maximum percentage of salary deductible for disciplinary reasons."
                              />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                className="w-full"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="courtOrderEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Court Orders
                              </FormLabel>
                              <ExplanationPopover
                                title="Court Orders"
                                content="Mandatory deductions like garnishee orders or maintenance."
                              />
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
                </div>
              </div>
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
