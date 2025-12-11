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

  // Bonus Settings
  annualBonusEnabled: z.boolean(),
  annualBonusType: z.enum(["DECEMBER", "BIRTH_MONTH"]),
  annualBonusPercentage: z.number().min(0).max(500),
  performanceBonusEnabled: z.boolean(),
  performanceBonusType: z.enum(["INDIVIDUAL", "TEAM"]),
  profitSharingEnabled: z.boolean(),
  profitSharingPercentage: z.number().min(0).max(100),
  thirteenthChequeEnabled: z.boolean(),
  spotBonusEnabled: z.boolean(),
  meritBonusEnabled: z.boolean(),
  appreciationBonusEnabled: z.boolean(),
  incentivePaymentEnabled: z.boolean(),
  recognitionAwardEnabled: z.boolean(),

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
  overpaymentEnabled: z.boolean(),
  overpaymentMaxPercentage: z.number().min(0).max(100),
  loanRepaymentEnabled: z.boolean(),
  funeralBenefitEnabled: z.boolean(),
  funeralBenefitAmount: z.number().min(0),
  tradeUnionEnabled: z.boolean(),
  insuranceEnabled: z.boolean(),
  guaranteeFundEnabled: z.boolean(),
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

  // Bonus Settings
  annualBonusEnabled: boolean;
  annualBonusType: string;
  annualBonusPercentage: number;
  performanceBonusEnabled: boolean;
  performanceBonusType: string;
  profitSharingEnabled: boolean;
  profitSharingPercentage: number;
  thirteenthChequeEnabled: boolean;
  spotBonusEnabled: boolean;
  meritBonusEnabled: boolean;
  appreciationBonusEnabled: boolean;
  incentivePaymentEnabled: boolean;
  recognitionAwardEnabled: boolean;

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
  overpaymentEnabled: boolean;
  overpaymentMaxPercentage: number;
  loanRepaymentEnabled: boolean;
  funeralBenefitEnabled: boolean;
  funeralBenefitAmount: number;
  tradeUnionEnabled: boolean;
  insuranceEnabled: boolean;
  guaranteeFundEnabled: boolean;
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

      // Bonus Settings Defaults
      annualBonusEnabled: true,
      annualBonusType: "DECEMBER",
      annualBonusPercentage: 100,
      performanceBonusEnabled: true,
      performanceBonusType: "INDIVIDUAL",
      profitSharingEnabled: false,
      profitSharingPercentage: 10,
      thirteenthChequeEnabled: false,
      spotBonusEnabled: true,
      meritBonusEnabled: true,
      appreciationBonusEnabled: true,
      incentivePaymentEnabled: true,
      recognitionAwardEnabled: true,

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
      overpaymentEnabled: true,
      overpaymentMaxPercentage: 25,
      loanRepaymentEnabled: true,
      funeralBenefitEnabled: true,
      funeralBenefitAmount: 100,
      tradeUnionEnabled: false,
      insuranceEnabled: true,
      guaranteeFundEnabled: false,
      savingsEnabled: true,
      savingsMaxPercentage: 15,
      disciplinaryEnabled: true,
      disciplinaryMaxPercentage: 50,
      courtOrderEnabled: true,
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
            // Existing settings
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

            // Bonus Settings
            annualBonusEnabled: settings.annualBonusEnabled ?? true,
            annualBonusType: settings.annualBonusType || "DECEMBER",
            annualBonusPercentage: settings.annualBonusPercentage ?? 100,
            performanceBonusEnabled: settings.performanceBonusEnabled ?? true,
            performanceBonusType: settings.performanceBonusType || "INDIVIDUAL",
            profitSharingEnabled: settings.profitSharingEnabled ?? false,
            profitSharingPercentage: settings.profitSharingPercentage ?? 10,
            thirteenthChequeEnabled: settings.thirteenthChequeEnabled ?? false,
            spotBonusEnabled: settings.spotBonusEnabled ?? true,
            meritBonusEnabled: settings.meritBonusEnabled ?? true,
            appreciationBonusEnabled: settings.appreciationBonusEnabled ?? true,
            incentivePaymentEnabled: settings.incentivePaymentEnabled ?? true,
            recognitionAwardEnabled: settings.recognitionAwardEnabled ?? true,

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
            overpaymentEnabled: settings.overpaymentEnabled ?? true,
            overpaymentMaxPercentage: settings.overpaymentMaxPercentage ?? 25,
            loanRepaymentEnabled: settings.loanRepaymentEnabled ?? true,
            funeralBenefitEnabled: settings.funeralBenefitEnabled ?? true,
            funeralBenefitAmount: settings.funeralBenefitAmount ?? 100,
            tradeUnionEnabled: settings.tradeUnionEnabled ?? false,
            insuranceEnabled: settings.insuranceEnabled ?? true,
            guaranteeFundEnabled: settings.guaranteeFundEnabled ?? false,
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
          : "HR settings saved successfully"
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
              <div className="grid grid-cols-3 gap-4">
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
                        <FormLabel>Half Day Threshold (hours)</FormLabel>
                        <ExplanationPopover
                          title="Half Day Threshold"
                          content="Minimum hours required to be considered a half day of work. Less than this may be considered absent."
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

                <FormField
                  control={form.control}
                  name="overtimeThreshold"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center">
                        <FormLabel>Overtime Threshold (hours)</FormLabel>
                        <ExplanationPopover
                          title="Overtime Threshold"
                          content="Daily hours worked beyond this threshold qualify for overtime pay."
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
                            100% of basic salary (double salary)
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
                                title="Annual Bonus Payment Timing"
                                content="DECEMBER: Paid as 13th cheque in December. BIRTH_MONTH: Paid during employee's birth month."
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
                                title="Bonus Percentage"
                                content="Percentage of basic salary paid as annual bonus. 100% means double salary (basic salary + same amount as bonus)."
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
                <FormField
                  control={form.control}
                  name="performanceBonusEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <FormLabel className="text-base">
                            Performance Bonus
                          </FormLabel>
                          <ExplanationPopover
                            title="Performance Bonus"
                            content="Bonus based on individual or team performance against set targets and goals."
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Individual/team performance based
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
                  <FormField
                    control={form.control}
                    name="performanceBonusType"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Performance Type</FormLabel>
                          <ExplanationPopover
                            title="Performance Bonus Type"
                            content="INDIVIDUAL: Based on individual performance metrics. TEAM: Based on team/department performance."
                          />
                        </div>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Profit Sharing */}
                <FormField
                  control={form.control}
                  name="profitSharingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <FormLabel className="text-base">
                            Profit Sharing Bonus
                          </FormLabel>
                          <ExplanationPopover
                            title="Profit Sharing Bonus"
                            content="Bonus distributed from company profits. Usually a percentage of profits shared among employees."
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Based on company profitability
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
                  <FormField
                    control={form.control}
                    name="profitSharingPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center">
                          <FormLabel>Profit Sharing %</FormLabel>
                          <ExplanationPopover
                            title="Profit Sharing Percentage"
                            content="Percentage of company profits allocated for distribution to employees."
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
                )}

                {/* 13th Cheque */}
                <FormField
                  control={form.control}
                  name="thirteenthChequeEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <FormLabel className="text-base">
                            13th Cheque
                          </FormLabel>
                          <ExplanationPopover
                            title="13th Cheque"
                            content="Additional month's salary paid in December. Common practice in South Africa as year-end bonus."
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Additional month's salary paid in December
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

                {/* Other Bonuses - Grid Layout */}
                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <FormField
                    control={form.control}
                    name="spotBonusEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">
                              Spot Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Spot Bonus"
                              content="Unexpected bonus for exceptional work or achievements outside regular bonus cycles."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Exceptional work awards
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
                    name="meritBonusEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">
                              Merit Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Merit Bonus"
                              content="Bonus based on individual merit, skills, and contributions to company success."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Individual performance
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
                    name="appreciationBonusEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">
                              Appreciation Bonus
                            </FormLabel>
                            <ExplanationPopover
                              title="Appreciation Bonus"
                              content="Bonus given to show appreciation for hard work, dedication, or loyalty."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Hard work recognition
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
                    name="incentivePaymentEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">
                              Incentive Payment
                            </FormLabel>
                            <ExplanationPopover
                              title="Incentive Payment"
                              content="Payment to motivate employees to achieve specific goals, targets, or sales objectives."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Target achievement
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
                    name="recognitionAwardEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <FormLabel className="text-sm">
                              Recognition Award
                            </FormLabel>
                            <ExplanationPopover
                              title="Recognition Award"
                              content="Bonus or award for achievements, milestones, or years of service."
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Milestones & service
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

            {/* Deduction Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Deduction Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Mandatory Deductions */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Mandatory Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="uifEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">UIF</FormLabel>
                              <ExplanationPopover
                                title="Unemployment Insurance Fund (UIF)"
                                content="Mandatory contribution providing benefits to employees who become unemployed or unable to work. 1% employee contribution matched by 1% employer contribution."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Unemployment Insurance
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
                                content="Employee contribution percentage for Unemployment Insurance Fund. Employer contributes same percentage."
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
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Insurance & Benefits */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Insurance & Benefits
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
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
                                content="Retirement savings plan. Contributions are tax-deductible and accumulate for retirement."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Retirement savings
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
                                title="Pension Contribution Percentage"
                                content="Percentage of salary contributed to pension fund. Usually 7.5-15% with employer matching."
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
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                                content="Health insurance coverage for employee and dependents. Premiums may be tax-deductible."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Health coverage
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
                              <FormLabel>Max Amount (ZAR)</FormLabel>
                              <ExplanationPopover
                                title="Medical Aid Maximum Deduction"
                                content="Maximum monthly deduction allowed for medical aid contributions."
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
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                                content="Group life insurance, disability insurance, or other insurance benefits."
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
                  </div>
                </div>

                {/* Company Property & Advances */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Company Property & Advances
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
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
                                title="Uniform/PPE Deduction"
                                content="Cost recovery for uniforms or personal protective equipment provided to employee."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Equipment cost
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
                                title="Uniform/PPE Maximum Deduction"
                                content="Maximum amount that can be deducted for uniform/PPE costs."
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
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                                title="Damage/Loss Deduction"
                                content="Deduction for damage or loss to company property due to employee negligence."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Property damage
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
                                title="Damage/Loss Maximum Percentage"
                                content="Maximum percentage of salary that can be deducted for damage/loss recovery."
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
                    )}

                    <FormField
                      control={form.control}
                      name="overpaymentEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Overpayment
                              </FormLabel>
                              <ExplanationPopover
                                title="Overpayment Recovery"
                                content="Recovery of salary overpayments from previous pay periods, with employee consent."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Salary overpayment
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
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Max % per Pay</FormLabel>
                              <ExplanationPopover
                                title="Overpayment Recovery Maximum"
                                content="Maximum percentage of salary that can be deducted per pay period for overpayment recovery."
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
                    )}

                    <FormField
                      control={form.control}
                      name="loanRepaymentEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Loan Repayment
                              </FormLabel>
                              <ExplanationPopover
                                title="Loan Repayment"
                                content="Deduction for repayment of loans or salary advances made to employee."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Employee loans
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

                {/* Voluntary & Other Deductions */}
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Voluntary & Other Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
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
                                content="Contribution to funeral benefit scheme providing financial assistance in case of death."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Death assistance
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
                            <div className="flex items-center">
                              <FormLabel>Amount (ZAR)</FormLabel>
                              <ExplanationPopover
                                title="Funeral Benefit Amount"
                                content="Monthly contribution amount for funeral benefit scheme."
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
                                disabled={!hasFullAccess && !canManageSettings}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                                title="Trade Union Dues"
                                content="Deduction for trade union membership fees, authorized by employee."
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
                                content="Contribution to fund covering losses from employees who handle cash/valuables."
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

                    <FormField
                      control={form.control}
                      name="savingsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">Savings</FormLabel>
                              <ExplanationPopover
                                title="Savings Scheme"
                                content="Deduction for employee savings plan or stokvel participation."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Employee savings
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
                                title="Savings Maximum Percentage"
                                content="Maximum percentage of salary that can be deducted for savings."
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
                    )}

                    <FormField
                      control={form.control}
                      name="disciplinaryEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Disciplinary
                              </FormLabel>
                              <ExplanationPopover
                                title="Disciplinary Action Deduction"
                                content="Deduction for disciplinary actions like suspension without pay."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Suspension without pay
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
                          <FormItem className="space-y-2">
                            <div className="flex items-center">
                              <FormLabel>Max % of Salary</FormLabel>
                              <ExplanationPopover
                                title="Disciplinary Maximum Deduction"
                                content="Maximum percentage of salary that can be deducted for disciplinary actions."
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
                    )}

                    <FormField
                      control={form.control}
                      name="courtOrderEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <FormLabel className="text-sm">
                                Court Orders
                              </FormLabel>
                              <ExplanationPopover
                                title="Court Order Deductions"
                                content="Mandatory deductions for maintenance, garnishee orders, or other court orders."
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Maintenance/garnish
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
