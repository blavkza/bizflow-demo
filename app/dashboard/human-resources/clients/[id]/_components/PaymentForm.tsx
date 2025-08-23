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
  invoicePaymentSchema,
  InvoicePaymentSchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Invoice, InvoicePaymentStatus, PaymentMethod } from "@prisma/client";
import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";

interface InvoicePaymentFormProps {
  type: "create" | "update";
  clientId: string;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
};

export default function InvoicePaymentForm({
  type,
  clientId,
  onCancel,
  onSubmitSuccess,
}: InvoicePaymentFormProps) {
  const router = useRouter();
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoices = async () => {
    if (!clientId) {
      setInvoicesOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axios.get<Invoice[]>("/api/invoices", {
        params: { clientId },
      });

      const clientInvoices =
        data?.filter(
          (invoice) =>
            invoice.status !== "CANCELLED" && invoice.clientId === clientId
        ) ?? [];

      const options = clientInvoices.map((invoice) => ({
        label: invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 4)}`,
        value: invoice.id,
      }));

      setInvoicesOptions(options);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to load invoices");
      setInvoicesOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  const form = useForm<InvoicePaymentSchemaType>({
    resolver: zodResolver(invoicePaymentSchema),
    defaultValues: {
      amount: 0,
      invoiceId: "",
      method: PaymentMethod.CASH,
      status: InvoicePaymentStatus.PENDING,
      paidAt: new Date(),
      reference: "",
      notes: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: InvoicePaymentSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/invoicePayment", values);
        toast.success("Payment created successfully");
      } else {
        // For update, you'd typically have an ID and use PUT/PATCH
        // await axios.put(`/api/invoicePayment/${paymentId}`, values);
        toast.success("Payment updated successfully");
      }

      form.reset();
      onSubmitSuccess?.();
      router.refresh();
      onCancel?.();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-6"
      >
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="my-2">Invoice</FormLabel>
              <Combobox
                options={invoicesOptions}
                value={field.value}
                onChange={field.onChange}
                isLoading={isLoading}
                placeholder="Select invoice"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter amount"
                  {...field}
                  className="w-full"
                  type="number"
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(PaymentMethod).map((method) => (
                    <SelectItem key={method} value={method}>
                      {formatLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Reference</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter payment reference"
                  {...field}
                  className="w-full"
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
            <FormItem className="space-y-2">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter any notes"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(InvoicePaymentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatLabel(status)}
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
              <span>Create Payment</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
