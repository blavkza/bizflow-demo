"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { addMonths } from "date-fns";
import { Plus, Paperclip } from "lucide-react";
import { DocumentUpload } from "./document-upload";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateLoan } from "@/lib/loan-calc";
import { formatCurrency } from "@/lib/formatters";
import { LenderModal } from "../lenders/_components/lender-modal";

const loanFormSchema = z.object({
  lender: z.string().min(1, "Lender name is required"),
  lenderId: z.string().optional().nullable().or(z.literal("")),
  loanType: z.string().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  interestRate: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1, "Start date is required"),
  firstPaymentDate: z.string().optional().nullable().or(z.literal("")),
  endDate: z.string().optional().nullable().or(z.literal("")),
  termMonths: z.coerce.number().int().optional().nullable(),
  description: z.string().optional().nullable().or(z.literal("")),
  monthlyPayment: z.coerce.number().optional().nullable(),
  calculationMethod: z
    .enum(["COMPOUND_INTEREST", "FIXED_INTEREST"])
    .default("COMPOUND_INTEREST"),
  interestType: z.enum(["FIXED", "PRIME_LINKED"]).default("FIXED"),
  primeMargin: z.coerce.number().default(0),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
  initialData?: any;
  lenders: any[];
  financialSettings?: any;
}

export const LoanModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  lenders,
  financialSettings,
}: LoanModalProps) => {
  const [loading, setLoading] = useState(false);
  const [openLenderModal, setOpenLenderModal] = useState(false);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().split("T")[0]
            : "",
        }
      : {
          lender: "",
          amount: 0,
          interestRate: 0,
          startDate: new Date().toISOString().split("T")[0],
          calculationMethod: "COMPOUND_INTEREST",
          interestType: "FIXED",
          primeMargin: 0,
        },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        amount: initialData.amount || 0,
        termMonths: initialData.termMonths || 0,
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
        firstPaymentDate: initialData.firstPaymentDate
          ? new Date(initialData.firstPaymentDate).toISOString().split("T")[0]
          : "",
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
        lenderId: initialData.lenderId || "OTHER",
        interestType: initialData.interestType || "FIXED",
        primeMargin: initialData.primeMargin || 0,
        interestRate: initialData.interestRate || 0,
      });
    } else {
      form.reset({
        lender: "",
        amount: 0,
        interestRate: 0,
        startDate: new Date().toISOString().split("T")[0],
        calculationMethod: "COMPOUND_INTEREST",
        interestType: "FIXED",
        primeMargin: 0,
        lenderId: "OTHER",
      });
    }
  }, [initialData, form, isOpen]);

  const watchStartDate = useWatch({ control: form.control, name: "startDate" });
  const watchAmount = useWatch({ control: form.control, name: "amount" });
  const watchRate = useWatch({ control: form.control, name: "interestRate" });
  const watchTerm = useWatch({ control: form.control, name: "termMonths" });
  const watchMethod = useWatch({
    control: form.control,
    name: "calculationMethod",
  });
  const watchInterestType = useWatch({
    control: form.control,
    name: "interestType",
  });
  const watchPrimeMargin = useWatch({
    control: form.control,
    name: "primeMargin",
  });
  const watchLenderId = useWatch({
    control: form.control,
    name: "lenderId",
  });

  const selectedLender = (lenders || []).find((l) => l.id === watchLenderId);

  // Calculate summary values
  const loanPrincipal = Number(watchAmount) || 0;
  const loanRate = Number(watchRate) || 0;
  const loanTerm = Number(watchTerm) || 0;

  let totalInterest = 0;
  let totalRepayment = 0;
  let calculatedMonthlyPayment = 0;

  if (loanPrincipal && loanRate && loanTerm) {
    if (watchMethod === "FIXED_INTEREST") {
      // Fixed Interest: Principal + (Principal * Rate% * (Term/12))
      // Actually usually fixed interest lenders charge e.g. 50% for 6 months -> Rate is the total rate for the period or annual?
      // Based on previous context, user said "allow lenders to offer different rates based on loan terms (3, 6, 9, and 12 months)"
      // And in previous code: tieredRate = selected.interestRateXMonths.
      // So the rate IS the rate for that term.
      // Wait, if 50% is for 6 months, is it 50% flat or per annum?
      // "Long-term Fixed Interest (Flat Rate)" implies Flat Rate.
      // Usually Flat Rate is: Interest = Principal * Rate%.
      // Let's assume the rate entered is the TOTAL flat rate for the term if it's coming from tiered.
      // BUT the input says "Interest Rate (%)".
      // Let's look at calculateLoan in loan-calc.ts to be sure how it handles it.
      // Assuming standard flat rate logic: Interest = Principal * (Rate/100).

      const {
        totalInterest: interest,
        totalPayable: total,
        monthlyPayment,
      } = calculateLoan(loanPrincipal, loanRate, loanTerm, "FIXED_INTEREST");
      totalInterest = interest;
      totalRepayment = total;
      calculatedMonthlyPayment = monthlyPayment;
    } else {
      const {
        totalInterest: interest,
        totalPayable: total,
        monthlyPayment,
      } = calculateLoan(loanPrincipal, loanRate, loanTerm, "COMPOUND_INTEREST");
      totalInterest = interest;
      totalRepayment = total;
      calculatedMonthlyPayment = monthlyPayment;
    }
  }

  useEffect(() => {
    // End Date calculation
    if (watchStartDate && watchTerm) {
      try {
        const start = new Date(watchStartDate);
        if (!isNaN(start.getTime())) {
          const end = addMonths(start, Number(watchTerm));
          form.setValue("endDate", end.toISOString().split("T")[0]);
        }
      } catch (e) {
        console.error("End date calculation error", e);
      }
    }

    // Interest Rate calculation based on Prime
    if (watchInterestType === "PRIME_LINKED" && financialSettings) {
      const calculatedRate =
        financialSettings.currentPrimeRate + Number(watchPrimeMargin || 0);
      form.setValue("interestRate", Number(calculatedRate.toFixed(2)));
    }

    // Monthly payment calculation
    if (watchAmount && watchRate && watchTerm) {
      const { monthlyPayment } = calculateLoan(
        Number(watchAmount),
        Number(watchRate),
        Number(watchTerm),
        watchMethod as "COMPOUND_INTEREST" | "FIXED_INTEREST",
      );
      form.setValue("monthlyPayment", Number(monthlyPayment.toFixed(2)));
    }
  }, [
    watchStartDate,
    watchAmount,
    watchRate,
    watchTerm,
    watchMethod,
    watchInterestType,
    watchPrimeMargin,
    financialSettings,
    form,
  ]);

  // Auto-switch Method based on Lender Support (Fixes stale state when only one method allowed)
  useEffect(() => {
    if (!selectedLender) return;

    let validMethods = [];
    if (
      selectedLender.loanCalculationMethods &&
      selectedLender.loanCalculationMethods.length > 0
    ) {
      validMethods = [...selectedLender.loanCalculationMethods];
    } else if (selectedLender.loanCalculationMethod) {
      validMethods = [selectedLender.loanCalculationMethod];
    }

    const currentMethod = form.getValues("calculationMethod");

    // If we have strict constraints and current method is invalid
    if (validMethods.length > 0 && !validMethods.includes(currentMethod)) {
      const newMethod = validMethods[0];
      if (newMethod) {
        form.setValue("calculationMethod", newMethod);
      }
    }
  }, [selectedLender, form, watchMethod]);

  const onSubmit = async (data: LoanFormValues) => {
    try {
      setLoading(true);
      if (initialData && initialData.id) {
        await axios.patch(`/api/loans/${initialData.id}`, data);
        toast.success("Loan updated successfully");
        onSuccess();
      } else {
        const response = await axios.post("/api/loans", data);
        toast.success("Loan created successfully");
        onSuccess(response.data);
      }
      onClose();
    } catch (error) {
      toast.error(
        initialData && initialData.id
          ? "Failed to update loan"
          : "Failed to create loan",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] lg:min-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialData && initialData.id ? "Edit Loan" : "Add New Loan"}
            </DialogTitle>
            <DialogDescription>
              {initialData && initialData.id
                ? "Update the details of the loan."
                : "Enter the details of the new loan."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                  Loan Details
                </h4>
                <FormField
                  control={form.control}
                  name="lenderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender</FormLabel>
                      <div className="flex items-center justify-between gap-2">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selected = (lenders || []).find(
                              (l: any) => l.id === value,
                            );
                            if (selected) {
                              form.setValue("lender", selected.name);

                              const defaultMethod =
                                selected.loanCalculationMethods &&
                                selected.loanCalculationMethods.length > 0
                                  ? selected.loanCalculationMethods[0]
                                  : selected.loanCalculationMethod ||
                                    "COMPOUND_INTEREST";

                              form.setValue("calculationMethod", defaultMethod);

                              // For FIXED_INTEREST loans with tiered rates, use the appropriate tier
                              if (defaultMethod === "FIXED_INTEREST") {
                                const termMonths = form.getValues("termMonths");
                                let tieredRate = selected.interestRate; // fallback

                                // Select rate based on term
                                if (
                                  termMonths === 3 &&
                                  selected.interestRate3Months
                                ) {
                                  tieredRate = selected.interestRate3Months;
                                } else if (
                                  termMonths === 6 &&
                                  selected.interestRate6Months
                                ) {
                                  tieredRate = selected.interestRate6Months;
                                } else if (
                                  termMonths === 9 &&
                                  selected.interestRate9Months
                                ) {
                                  tieredRate = selected.interestRate9Months;
                                } else if (
                                  termMonths === 12 &&
                                  selected.interestRate12Months
                                ) {
                                  tieredRate = selected.interestRate12Months;
                                }

                                if (tieredRate) {
                                  form.setValue("interestRate", tieredRate);
                                }
                              } else {
                                // For COMPOUND_INTEREST, use standard rate
                                if (selected.interestRate) {
                                  form.setValue(
                                    "interestRate",
                                    selected.interestRate,
                                  );
                                }
                              }

                              if (selected.termMonths)
                                form.setValue(
                                  "termMonths",
                                  selected.termMonths,
                                );
                            }
                          }}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a lender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(lenders || []).map((lender: any) => (
                              <SelectItem key={lender.id} value={lender.id}>
                                {lender.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="OTHER">
                              Other / One-time
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {!initialData && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenLenderModal(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> New Lender
                          </Button>
                        )}
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("lenderId") === "OTHER" && (
                  <FormField
                    control={form.control}
                    name="lender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lender Name (Other)</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="calculationMethod"
                    render={({ field }) => {
                      const showCompound =
                        !selectedLender ||
                        (selectedLender.loanCalculationMethods &&
                          selectedLender.loanCalculationMethods.includes(
                            "COMPOUND_INTEREST",
                          )) ||
                        selectedLender.loanCalculationMethod ===
                          "COMPOUND_INTEREST" ||
                        (!selectedLender.loanCalculationMethods &&
                          !selectedLender.loanCalculationMethod);

                      const showFixed =
                        !selectedLender ||
                        (selectedLender.loanCalculationMethods &&
                          selectedLender.loanCalculationMethods.includes(
                            "FIXED_INTEREST",
                          )) ||
                        selectedLender.loanCalculationMethod ===
                          "FIXED_INTEREST";

                      const options = [];
                      if (showCompound)
                        options.push({
                          label: "Monthly Compound Interest",
                          value: "COMPOUND_INTEREST",
                        });
                      if (showFixed)
                        options.push({
                          label: "Long-term Fixed Interest",
                          value: "FIXED_INTEREST",
                        });

                      if (options.length === 1) {
                        return (
                          <FormItem>
                            <FormLabel>Loan Type</FormLabel>
                            <FormControl>
                              <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm flex items-center text-muted-foreground">
                                {options[0].label}
                              </div>
                            </FormControl>
                            <input
                              type="hidden"
                              {...field}
                              value={options[0].value}
                            />
                            <FormMessage />
                          </FormItem>
                        );
                      }

                      return (
                        <FormItem>
                          <FormLabel>Loan Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                {/* Tiered Interest Selection for Fixed Loans */}
                {watchMethod === "FIXED_INTEREST" &&
                  selectedLender &&
                  (selectedLender.interestTiers?.length > 0 ||
                    selectedLender.interestRate3Months ||
                    selectedLender.interestRate6Months ||
                    selectedLender.interestRate9Months ||
                    selectedLender.interestRate12Months) && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h5 className="font-medium text-sm">
                        Select Loan Term & Rate
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedLender.interestTiers &&
                        selectedLender.interestTiers.length > 0
                          ? selectedLender.interestTiers
                          : [
                              selectedLender.interestRate3Months
                                ? {
                                    termMonths: 3,
                                    interestRate:
                                      selectedLender.interestRate3Months,
                                  }
                                : null,
                              selectedLender.interestRate6Months
                                ? {
                                    termMonths: 6,
                                    interestRate:
                                      selectedLender.interestRate6Months,
                                  }
                                : null,
                              selectedLender.interestRate9Months
                                ? {
                                    termMonths: 9,
                                    interestRate:
                                      selectedLender.interestRate9Months,
                                  }
                                : null,
                              selectedLender.interestRate12Months
                                ? {
                                    termMonths: 12,
                                    interestRate:
                                      selectedLender.interestRate12Months,
                                  }
                                : null,
                            ].filter(Boolean)
                        ).map((tier: any) => {
                          const months = tier.termMonths;
                          const rate = tier.interestRate;
                          const isSelected = Number(watchTerm) === months;

                          return (
                            <div
                              key={months}
                              className={`cursor-pointer p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary/50 bg-background"}`}
                              onClick={() => {
                                form.setValue("termMonths", months);
                                form.setValue("interestRate", Number(rate));
                                // Also calculate end date immediately
                                const start = new Date(watchStartDate);
                                if (!isNaN(start.getTime())) {
                                  const end = addMonths(start, months);
                                  form.setValue(
                                    "endDate",
                                    end.toISOString().split("T")[0],
                                  );
                                }
                              }}
                            >
                              <span className="font-bold text-lg">
                                {months} Months
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">
                                @ {rate}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstPaymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Payment Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                  Repayment Terms
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term (Months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Loan Calculation Summary */}
                {watchAmount > 0 && watchRate > 0 && watchTerm > 0 && (
                  <div className="space-y-4 p-4 rounded-lg bg-slate-50 border mt-4">
                    <h4 className="font-medium text-sm text-slate-700 border-b pb-2 mb-3">
                      Loan Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">
                          Principal Amount
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(loanPrincipal)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">
                          Interest Amount
                        </span>
                        <span className="font-semibold text-amber-600">
                          {formatCurrency(totalInterest)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">
                          Total Repayment
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(totalRepayment)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs">
                          Monthly Payment
                        </span>
                        <span className="font-bold text-lg">
                          {formatCurrency(calculatedMonthlyPayment)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                  Additional Info
                </h4>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Details about this loan..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {initialData && initialData.id && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Documents
                  </h4>
                  <DocumentUpload
                    entityId={initialData.id}
                    entityType="loan"
                    onSuccess={onSuccess}
                    showList={true}
                  />
                </div>
              )}

              <DialogFooter>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading
                    ? initialData && initialData.id
                      ? "Updating..."
                      : "Creating..."
                    : initialData && initialData.id
                      ? "Update Loan"
                      : "Create Loan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <LenderModal
        isOpen={openLenderModal}
        onClose={() => setOpenLenderModal(false)}
        onSuccess={(newLender) => {
          // onSuccess from modal parent should handle refetch
          form.setValue("lenderId", newLender.id);
          form.setValue("lender", newLender.name);
          if (newLender.interestRate)
            form.setValue("interestRate", newLender.interestRate);
          if (newLender.termMonths)
            form.setValue("termMonths", newLender.termMonths);
        }}
      />
    </>
  );
};
