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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Client,
  Transaction,
  TransactionStatus,
  TransactionType,
  Invoice,
  Category,
  PaymentMethod,
} from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  TransactionFormValues,
  transactionSchema,
} from "@/lib/formValidationSchemas";

interface TransactionFormProps {
  type: "create" | "update";
  data?: Transaction;
  onCancel?: () => void;
  onOpenChange?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
  type?: string;
};

export default function TransactionForm({
  type,
  data,
  onCancel,
  onOpenChange,
  onSubmitSuccess,
}: TransactionFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TransactionType>(
    data?.type || TransactionType.EXPENSE
  );
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [relationType, setRelationType] = useState<
    "client" | "invoice" | "none"
  >(data?.clientId ? "client" : data?.invoiceId ? "invoice" : "none");

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients.map((client) => ({
        label: client.name || `Client ${client.id.slice(0, 4)}`,
        value: client.id,
      }));
      setClientsOptions(options);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/invoices");
      const invoices: Invoice[] = response?.data || [];

      const options = invoices
        .filter((invoice) => invoice.status !== "CANCELLED")
        .map((invoice) => ({
          label: invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 4)}`,
          value: invoice.id,
        }));

      setInvoicesOptions(options);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/category");
      const categories: Category[] = response?.data || [];
      const options = categories
        .filter((category) => category.id && category.name)
        .map((category) => ({
          label: category.name || "",
          value: category.id,
          type: category.type,
        }));
      setCategoriesOptions(options);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCategories();
    fetchInvoices();
  }, []);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: data?.amount ? Number(data.amount) : 0,
      currency: data?.currency || "ZAR",
      type: data?.type || TransactionType.EXPENSE,
      status: data?.status || TransactionStatus.COMPLETED,
      description: data?.description || "",
      reference: data?.reference || "",
      date: data?.date ? new Date(data.date) : new Date(),
      invoiceId: data?.invoiceId || "",
      categoryId: data?.categoryId || "",
      clientId: data?.clientId || "",
      vendor: data?.vendor || "",
      method: data?.method || PaymentMethod.CASH,
    },
  });

  const handleRelationChange = (value: "client" | "invoice" | "none") => {
    setRelationType(value);
    if (value !== "client") form.setValue("clientId", "");
    if (value !== "invoice") form.setValue("invoiceId", "");
  };

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      if (type === "create") {
        await axios.post("/api/transactions", values);
        toast.success("Transaction created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/transactions/${data.id}`, values);
        toast.success("Transaction updated successfully");
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

  const filteredCategories = categoriesOptions.filter((category) => {
    if (selectedType === TransactionType.TRANSFER) return true;
    return category.type === selectedType;
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value as TransactionType);
                    form.resetField("categoryId");
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TransactionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PaymentMethod).map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0) + method.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className="h-10"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.valueAsNumber || e.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input placeholder="ZAR" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 pl-3 text-left font-normal",
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Transaction description"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Relation Type Radio Group */}
          <div className="col-span-2 space-y-2">
            <Label>Transaction Relation</Label>
            <RadioGroup
              value={relationType}
              onValueChange={handleRelationChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="r1" />
                <Label htmlFor="r1">Client</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="invoice" id="r2" />
                <Label htmlFor="r2">Invoice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="r3" />
                <Label htmlFor="r3">None</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Client - Only shown when "client" is selected */}
          {relationType === "client" && (
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Client</FormLabel>
                  <Combobox
                    options={clientsOptions}
                    value={field.value}
                    onChange={field.onChange}
                    isLoading={isLoading}
                    placeholder="Select client"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Invoice - Only shown when "invoice" is selected */}
          {relationType === "invoice" && (
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Invoice</FormLabel>
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
          )}

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Category</FormLabel>
                <Combobox
                  options={filteredCategories}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isLoading}
                  placeholder="Select category"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor */}
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Vendor name"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reference */}
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Reference number"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
