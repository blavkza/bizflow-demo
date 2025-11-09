"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  CalendarIcon,
  X,
  Plus,
  Calculator,
  FileText,
  Repeat,
} from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  InvoiceStatus,
  DiscountType,
  Client,
  Invoice,
  InvoiceItem,
  GeneralSetting,
  ShopProduct,
  RecurringFrequency,
  RecurringStatus,
} from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import {
  InvoiceSchema,
  RecurringInvoiceSchema,
} from "@/lib/formValidationSchemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/app/dashboard/human-resources/clients/_components/client-Form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type ComboboxOption = {
  label: string;
  value: string;
};

interface invoicePrompt {
  invoice: Invoice & {
    client: Client;
    items: InvoiceItem[];
    creator: {
      name: string;
      GeneralSetting: GeneralSetting | null;
    };
  };
}

interface CalculationSummary {
  subtotal: number;
  totalTax: number;
  discountAmount: number;
  totalAmount: number;
}

// Extended form schema to include recurring options
const InvoiceFormSchema = InvoiceSchema.extend({
  isRecurring: z.boolean().default(false),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  interval: z.number().min(1).max(365).default(1).optional(),
  endDate: z.date().optional(),
});

type InvoiceFormData = z.infer<typeof InvoiceFormSchema>;

export default function InvoiceForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: {
  type: "create" | "update";
  data: invoicePrompt;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}) {
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [productsOptions, setProductsOptions] = useState<ComboboxOption[]>([]);
  const [productsData, setProductsData] = useState<ShopProduct[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [calculations, setCalculations] = useState<CalculationSummary>({
    subtotal: 0,
    totalTax: 0,
    discountAmount: 0,
    totalAmount: 0,
  });
  const [isRecurring, setIsRecurring] = useState(
    data?.invoice?.isRecurring || false
  );

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      clientId: data?.invoice?.clientId || "",
      description: data?.invoice?.description || "",
      status: data?.invoice?.status || "DRAFT",
      issueDate: data?.invoice?.issueDate
        ? new Date(data.invoice.issueDate)
        : new Date(),
      dueDate: data?.invoice?.dueDate
        ? new Date(data.invoice.dueDate)
        : new Date(),
      currency: "ZAR",
      items:
        data?.invoice?.items?.length > 0
          ? data.invoice.items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              taxRate: item.taxRate ? Number(item.taxRate) : 0,
              shopProductId: (item as any).shopProductId || null,
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 0,
                shopProductId: null,
              },
            ],
      discountType: data?.invoice?.discountType || undefined,
      discountAmount: data?.invoice?.discountAmount
        ? Number(data?.invoice?.discountAmount)
        : undefined,
      paymentTerms: data?.invoice?.paymentTerms || "",
      notes: data?.invoice?.notes || "",
      isRecurring: data?.invoice?.isRecurring || false,
      frequency: "MONTHLY",
      interval: 1,
      endDate: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  // Calculate totals function
  const calculateTotals = useCallback(
    (items: any[], discountType?: string, discountAmount: number = 0) => {
      const itemsWithAmounts = items.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
        taxAmount: (item.quantity * item.unitPrice * (item.taxRate || 0)) / 100,
      }));

      const subtotal = itemsWithAmounts.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalTax = itemsWithAmounts.reduce(
        (sum, item) => sum + (item.taxAmount || 0),
        0
      );

      let calculatedDiscount = 0;
      if (discountType === "PERCENTAGE" && discountAmount) {
        calculatedDiscount = subtotal * (discountAmount / 100);
      } else if (discountType === "AMOUNT" && discountAmount) {
        calculatedDiscount = discountAmount;
      }

      const totalAmount = subtotal + totalTax - calculatedDiscount;

      return {
        subtotal,
        totalTax,
        discountAmount: calculatedDiscount,
        totalAmount,
      };
    },
    []
  );

  // Calculate totals whenever items or discount change
  useEffect(() => {
    const updateCalculations = () => {
      const items = form.getValues("items");
      const discountType = form.getValues("discountType");
      const discountAmount = form.getValues("discountAmount") || 0;

      const newCalculations = calculateTotals(
        items,
        discountType,
        discountAmount
      );
      setCalculations(newCalculations);
    };

    // Initial calculation
    updateCalculations();

    // Watch for changes using form.watch with subscription
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith("items") ||
        name === "discountType" ||
        name === "discountAmount"
      ) {
        updateCalculations();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, calculateTotals]);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients
        .filter((client) => client.id && client.name)
        .map((client) => ({
          label: client.name || "",
          value: client.id,
        }));
      setClientsOptions(options);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get("/api/shop/products");
      const products: ShopProduct[] = response?.data || [];
      setProductsData(products);
      const options = products
        .filter((product) => product.id && product.name)
        .map((product) => ({
          label: `${product.name} - R${Number(product.price || 0).toFixed(2)}`,
          value: product.id,
        }));
      setProductsOptions(options);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/general");
      const { data } = await response.json();

      const defaultSetting = data;
      if (type === "create" && defaultSetting) {
        form.setValue("paymentTerms", defaultSetting.paymentTerms || "");
        form.setValue("notes", defaultSetting.note || "");
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch settings", error);
      return null;
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchClients();
    fetchProducts();
  }, []);

  const getNextInvoiceDate = (
    startDate: Date,
    frequency: RecurringFrequency,
    interval: number
  ): Date => {
    const date = new Date(startDate);

    switch (frequency) {
      case "DAILY":
        date.setDate(date.getDate() + interval);
        break;
      case "WEEKLY":
        date.setDate(date.getDate() + interval * 7);
        break;
      case "MONTHLY":
        date.setMonth(date.getMonth() + interval);
        break;
      case "QUARTERLY":
        date.setMonth(date.getMonth() + interval * 3);
        break;
      case "YEARLY":
        date.setFullYear(date.getFullYear() + interval);
        break;
    }

    return date;
  };

  const getFrequencyLabel = (
    frequency: RecurringFrequency,
    interval: number
  ): string => {
    const intervalText = interval > 1 ? `${interval} ` : "";

    switch (frequency) {
      case "DAILY":
        return `${intervalText}day${interval > 1 ? "s" : ""}`;
      case "WEEKLY":
        return `${intervalText}week${interval > 1 ? "s" : ""}`;
      case "MONTHLY":
        return `${intervalText}month${interval > 1 ? "s" : ""}`;
      case "QUARTERLY":
        return `${intervalText}quarter${interval > 1 ? "s" : ""}`;
      case "YEARLY":
        return `${intervalText}year${interval > 1 ? "s" : ""}`;
      default:
        return "";
    }
  };

  const onSubmit = async (values: InvoiceFormData) => {
    try {
      const itemsWithProductIds = values.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        shopProductId: (item as any).shopProductId || null,
      }));

      const invoiceData = {
        ...values,
        amount: calculations.subtotal,
        taxAmount: calculations.totalTax,
        taxRate:
          calculations.totalTax > 0
            ? (calculations.totalTax / calculations.subtotal) * 100
            : 0,
        discountAmount: values.discountAmount,
        totalAmount: calculations.totalAmount,
        items: itemsWithProductIds,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };

      if (values.isRecurring) {
        const recurringData = {
          clientId: values.clientId,
          description: values.description,
          frequency: values.frequency!,
          interval: values.interval!,
          startDate: values.issueDate.toISOString(),
          endDate: values.endDate ? values.endDate.toISOString() : null,
          items: itemsWithProductIds,
          currency: values.currency,
          discountType: values.discountType,
          discountAmount: values.discountAmount,
          paymentTerms: values.paymentTerms,
          notes: values.notes,
        };

        await axios.post("/api/invoices/recurring", recurringData);
        toast.success("Recurring invoice created successfully");
      } else {
        if (type === "create") {
          await axios.post("/api/invoices", invoiceData);
          toast.success("Invoice created successfully");
        } else {
          await axios.put(`/api/invoices/${data.invoice.id}`, invoiceData);
          toast.success("Invoice updated successfully");
        }
      }

      onSubmitSuccess();
    } catch (error: any) {
      console.error("Invoice error:", error);

      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          toast.error(error.response.data);
        } else if (Array.isArray(error.response.data)) {
          const errorMessages = error.response.data.map(
            (err: any) => `${err.path.join(".")}: ${err.message}`
          );
          toast.error(`Validation failed: ${errorMessages.join(", ")}`);
        } else {
          toast.error("An error occurred");
        }
      } else {
        toast.error(
          `Something went wrong while ${
            type === "create" ? "creating" : "updating"
          } the invoice`
        );
      }
    }
  };

  const addItem = () => {
    form.setValue("items", [
      ...form.getValues("items"),
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        shopProductId: null,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue(
        "items",
        items.filter((_, i) => i !== index)
      );
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (!productsData || !Array.isArray(productsData)) {
      console.error("Products data not loaded yet");
      toast.error("Products not loaded. Please try again.");
      return;
    }

    const selectedProduct = productsData.find((p) => p.id === productId);
    if (selectedProduct) {
      form.setValue(
        `items.${index}.description`,
        `${selectedProduct.name} - ${selectedProduct.category || "No Category"}`
      );
      form.setValue(`items.${index}.unitPrice`, Number(selectedProduct.price));
      form.setValue(`items.${index}.shopProductId`, selectedProduct.id);
      form.setValue(`items.${index}.taxRate`, 15);
    } else {
      console.error("Product not found with ID:", productId);
      toast.error("Selected product not found");
    }
  };

  const handleManualItemChange = (index: number) => {
    const rawDescription = form.getValues(`items.${index}.description`);
    const cleanedDescription = String(rawDescription)
      .split(/[\s\-]+/)
      .filter(
        (part) =>
          part &&
          part.toLowerCase() !== "null" &&
          part.toLowerCase() !== "undefined"
      )
      .join(" ");

    const unitPrice = form.getValues(`items.${index}.unitPrice`);

    form.setValue(`items.${index}.description`, cleanedDescription.trim());
    form.setValue(`items.${index}.unitPrice`, unitPrice);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  // Watch recurring fields for real-time updates
  const watchedFrequency = form.watch("frequency");
  const watchedInterval = form.watch("interval");
  const watchedIssueDate = form.watch("issueDate");
  const watchedEndDate = form.watch("endDate");

  const nextInvoiceDate =
    isRecurring && watchedFrequency && watchedIssueDate
      ? getNextInvoiceDate(
          watchedIssueDate,
          watchedFrequency,
          watchedInterval || 1
        )
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {type === "create"
                    ? "Create a new invoice for your client"
                    : "Update the invoice details"}
                </p>
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsRecurring(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">
                        Recurring Invoice
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {isRecurring && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <Repeat className="h-3 w-3 mr-1" />
                  Recurring
                </Badge>
              )}
            </div>
          </div>

          {/* Client and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Combobox
                        options={clientsOptions}
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isLoadingClients}
                        placeholder="Select a client"
                      />
                    </FormControl>
                    <Dialog
                      open={isAddDialogOpen}
                      onOpenChange={setIsAddDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          disabled={isLoadingClients}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">
                            Add
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Client</DialogTitle>
                          <DialogDescription>
                            Create a new client profile. This client will be
                            immediately available for selection.
                          </DialogDescription>
                        </DialogHeader>
                        <ClientForm
                          type="create"
                          onCancel={() => setIsAddDialogOpen(false)}
                          onSubmitSuccess={() => {
                            setIsAddDialogOpen(false);
                            fetchClients();
                            toast.success("Client added successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates and Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Issue Date *</FormLabel>
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
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date *</FormLabel>
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
                        disabled={(date) => {
                          const issueDate = form.getValues("issueDate");
                          return issueDate ? date < issueDate : false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(InvoiceStatus).map((status) => (
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

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Recurring Settings */}
          {isRecurring && (
            <div className="mt-6 p-4 border rounded-lg bg-blue-50/50">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                <Repeat className="h-4 w-4" />
                Recurring Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          placeholder="1"
                          value={field.value === undefined ? 1 : field.value}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
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
                                <span>No end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < form.getValues("issueDate")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurring Summary */}
              {watchedFrequency && (
                <div className="mt-3 p-3 bg-white rounded border text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium">
                      Every{" "}
                      {getFrequencyLabel(
                        watchedFrequency,
                        watchedInterval || 1
                      )}
                    </span>
                  </div>
                  {nextInvoiceDate && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">
                        Next invoice:
                      </span>
                      <span className="font-medium text-green-600">
                        {format(nextInvoiceDate, "PPP")}
                      </span>
                    </div>
                  )}
                  {watchedEndDate && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Ends:</span>
                      <span className="font-medium text-orange-600">
                        {format(watchedEndDate, "PPP")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Invoice Items</h3>
              <p className="text-sm text-muted-foreground">
                Add products or services to your invoice
              </p>
            </div>
          </div>

          {/* Items Header */}
          <div className="grid grid-cols-12 gap-3 mb-3 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium">
            <div className="col-span-5">Item Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Tax %</div>
            <div className="col-span-1"></div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {form.watch("items").map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                {/* Product Selection & Description */}
                <div className="col-span-5 space-y-2">
                  <Combobox
                    options={productsOptions}
                    value={(item as any).shopProductId || ""}
                    onChange={(value) => handleProductSelect(index, value)}
                    isLoading={isLoadingProducts}
                    placeholder="Select product"
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="mb-0">
                        <FormControl>
                          <Input
                            placeholder="Or enter custom description"
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              handleManualItemChange(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Quantity */}
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          className="text-center"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price */}
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          className="text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.valueAsNumber || e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name={`items.${index}.taxRate`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          className="text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.valueAsNumber || e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-1"
                  onClick={() => removeItem(index)}
                  disabled={form.watch("items").length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Discount & Calculation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discount Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Discount</h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("discountType") && (
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Amount{" "}
                        {form.watch("discountType") === "PERCENTAGE"
                          ? "(%)"
                          : ""}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step={
                            form.watch("discountType") === "PERCENTAGE"
                              ? "0.1"
                              : "1.00"
                          }
                          placeholder={
                            form.watch("discountType") === "PERCENTAGE"
                              ? "0.00%"
                              : "0.00"
                          }
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const input = e.target.value;
                            if (input === "") {
                              field.onChange(undefined);
                              return;
                            }
                            let value = parseFloat(input);
                            if (isNaN(value)) {
                              field.onChange(undefined);
                              return;
                            }
                            if (
                              form.watch("discountType") === "PERCENTAGE" &&
                              value > 100
                            ) {
                              value = 100;
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.totalTax)}
                </span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">
                    -{formatCurrency(calculations.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(calculations.totalAmount)}
                </span>
              </div>
              {isRecurring && (
                <div className="flex justify-between text-sm text-blue-600 border-t pt-2">
                  <span>Recurring total:</span>
                  <span className="font-medium">
                    {formatCurrency(calculations.totalAmount)} /{" "}
                    {getFrequencyLabel(
                      watchedFrequency || "MONTHLY",
                      watchedInterval || 1
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Notes */}
        <div className="bg-card border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Additional Information</h4>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment terms and conditions..."
                      className="resize-none"
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
                      placeholder="Additional notes or instructions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-32">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {type === "create" ? "Creating..." : "Updating..."}
                {isRecurring && " Recurring..."}
              </>
            ) : (
              `${type === "create" ? "Create" : "Update"} Invoice${isRecurring ? " (Recurring)" : ""}`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
