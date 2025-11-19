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
import { PaymentType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { WorkerWithDetails } from "@/types/payroll";

// Update schema to handle empty string and transform to number
const WorkerPayrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  amount: z.union([
    z.number().min(0.01, "Amount must be greater than 0"),
    z
      .string()
      .min(1, "Amount is required")
      .transform((val) => Number(val))
      .refine((val) => val > 0, "Amount must be greater than 0"),
  ]),
});

interface WorkerPaymentFormProps {
  worker: WorkerWithDetails;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

export function WorkerPaymentForm({
  worker,
  onCancel,
  onSubmitSuccess,
}: WorkerPaymentFormProps) {
  const form = useForm<z.infer<typeof WorkerPayrollSchema>>({
    resolver: zodResolver(WorkerPayrollSchema),
    defaultValues: {
      description: "",
      type: "SALARY",
      amount: getDefaultAmount(worker),
    },
  });

  const { isSubmitting } = form.formState;

  function getDefaultAmount(worker: WorkerWithDetails): number {
    if (worker.isFreelancer) {
      return Number(worker.salary);
    } else {
      const emp = worker as any;
      if (emp.salaryType === "DAILY") {
        return Number(emp.dailySalary || emp.salary || 0);
      } else {
        return Number(emp.monthlySalary || emp.salary || 0) / 22;
      }
    }
  }

  const onSubmit = async (values: z.infer<typeof WorkerPayrollSchema>) => {
    try {
      const paymentData = {
        description: values.description,
        type: values.type,
        amount: values.amount,
        workerId: worker.id,
        isFreelancer: worker.isFreelancer,
        departmentId: worker.department?.id,
      };

      await axios.post("/api/payment", paymentData);

      toast.success("Payment processed successfully");
      form.reset();
      onSubmitSuccess();
    } catch (error) {
      toast.error("Something went wrong while processing payment!");
      console.error("Payment processing error:", error);
    }
  };

  const formatLabel = (str: string) => {
    return str
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      field.onChange(0);
                      return;
                    }
                    const value = parseFloat(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                  onBlur={() => {
                    if (form.getValues("amount") === 0) {
                      form.setValue("amount", getDefaultAmount(worker));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(PaymentType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Process Payment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
