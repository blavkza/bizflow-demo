// app/dashboard/invoices/[id]/_components/AddPaymentForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { toast } from "sonner";
import axios from "axios";
import { Combobox } from "@/components/ui/combobox";

const paymentSchema = z.object({
  amount: z
    .number()
    .min(0.01, "Amount must be greater than 0")
    .max(1000000000, "Amount is too large"), // Add upper limit for safety
  method: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "MOBILE_PAYMENT",
    "INVOICE",
  ]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, "Payment date is required"),
  categoryId: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface CategoryOption {
  label: string;
  value: string;
  type: string;
}

interface AddPaymentFormProps {
  invoiceId: string;
  remainingBalance: number;
  onSuccess: () => void;
}

export default function AddPaymentForm({
  invoiceId,
  remainingBalance,
  onSuccess,
}: AddPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: Math.min(
        remainingBalance,
        remainingBalance > 0 ? remainingBalance : 0
      ),
      method: "BANK_TRANSFER",
      reference: "",
      notes: "",
      paidAt: new Date().toISOString().split("T")[0],
      categoryId: "",
    },
  });

  // Watch the amount field to validate against remaining balance
  const watchedAmount = form.watch("amount");

  // Validate amount against remaining balance
  useEffect(() => {
    if (watchedAmount > remainingBalance) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`,
      });
    } else {
      form.clearErrors("amount");
    }
  }, [watchedAmount, remainingBalance, form]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await axios.get("/api/category");
        const categories = response?.data || [];
        const options = categories
          .filter((category: any) => category.id && category.name)
          .map((category: any) => ({
            label: category.name || "",
            value: category.id,
            type: category.type,
          }));
        setCategoriesOptions(options);

        // Auto-select INVOICE_PAYMENT category if it exists
        const invoicePaymentCategory = options.find(
          (cat: CategoryOption) => cat.label === "INVOICE_PAYMENT"
        );
        if (invoicePaymentCategory) {
          form.setValue("categoryId", invoicePaymentCategory.value);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        toast.error("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [form]);

  const onSubmit = async (values: PaymentFormData) => {
    // Client-side validation
    if (values.amount > remainingBalance) {
      toast.error(
        `Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`
      );
      return;
    }

    if (values.amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/api/invoices/${invoiceId}/payments`,
        values
      );
      toast.success("Payment recorded successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to record payment:", error);

      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          // Zod validation errors
          const errorMessages = error.response.data.error.map(
            (err: any) => `${err.path?.join(".")}: ${err.message}`
          );
          toast.error(`Validation failed: ${errorMessages.join(", ")}`);
        } else {
          toast.error(error.response.data.error);
        }
      } else {
        toast.error("Failed to record payment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;

    // Prevent entering more than remaining balance
    if (amount > remainingBalance) {
      form.setValue("amount", remainingBalance);
    } else {
      form.setValue("amount", amount);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={field.value}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={field.onBlur}
                  className={
                    form.formState.errors.amount ? "border-red-500" : ""
                  }
                />
              </FormControl>
              <FormMessage />
              <div className="text-sm text-muted-foreground">
                Remaining balance:{" "}
                <span className="font-medium">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div className="text-xs text-blue-600">
                  Maximum allowed: {formatCurrency(remainingBalance)}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                  <SelectItem value="INVOICE">Invoice</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                  options={categoriesOptions}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isLoadingCategories}
                  placeholder="Select category"
                />
              </FormControl>
              <FormMessage />
              <div className="text-sm text-muted-foreground">
                {!field.value &&
                  "INVOICE_PAYMENT category will be created automatically if not selected"}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., bank reference, transaction ID"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional payment notes..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            watchedAmount > remainingBalance ||
            watchedAmount <= 0
          }
          className="w-full"
        >
          {isSubmitting ? "Recording Payment..." : "Record Payment"}
        </Button>

        {/* Warning message if amount exceeds balance */}
        {watchedAmount > remainingBalance && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Payment amount exceeds remaining balance
            </p>
            <p className="text-xs text-red-500 mt-1">
              Please reduce the amount to {formatCurrency(remainingBalance)} or
              less
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}
