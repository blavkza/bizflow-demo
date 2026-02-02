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
import { LenderModal } from "../lenders/_components/lender-modal";

const loanFormSchema = z.object({
  lender: z.string().min(1, "Lender name is required"),
  lenderId: z.string().optional().nullable().or(z.literal("")),
  loanType: z.string().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  interestRate: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable().or(z.literal("")),
  termMonths: z.coerce.number().int().optional().nullable(),
  description: z.string().optional().nullable().or(z.literal("")),
  monthlyPayment: z.coerce.number().optional().nullable(),
  calculationMethod: z.enum(["AMORTIZED", "FLAT"]).default("AMORTIZED"),
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
          calculationMethod: "AMORTIZED",
          interestType: "FIXED",
          primeMargin: 0,
        },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
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
        calculationMethod: "AMORTIZED",
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
        watchMethod as "AMORTIZED" | "FLAT",
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

  const onSubmit = async (data: LoanFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
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
        initialData ? "Failed to update loan" : "Failed to create loan",
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
              {initialData ? "Edit Loan" : "Add New Loan"}
            </DialogTitle>
            <DialogDescription>
              {initialData
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
                              if (selected.interestRate)
                                form.setValue(
                                  "interestRate",
                                  selected.interestRate,
                                );
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
                    name="loanType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Term Loan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "FIXED"}
                          defaultValue={field.value || "FIXED"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed Rate</SelectItem>
                            <SelectItem value="PRIME_LINKED">
                              Prime Linked
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchInterestType === "FIXED" ? (
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
                  ) : (
                    <FormField
                      control={form.control}
                      name="primeMargin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margin (Prime + %)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Prime ({financialSettings?.currentPrimeRate || 0}%)
                            + {watchPrimeMargin || 0}% = {watchRate || 0}%
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                <FormField
                  control={form.control}
                  name="calculationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "AMORTIZED"}
                        defaultValue={field.value || "AMORTIZED"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AMORTIZED">
                            Standard (Reducing Balance)
                          </SelectItem>
                          <SelectItem value="FLAT">
                            Flat Rate (Short Term)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                  Repayment Terms
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Payment</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

              {initialData && (
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
                    ? initialData
                      ? "Updating..."
                      : "Creating..."
                    : initialData
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
