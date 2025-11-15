"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Loader2,
  Plus,
  X,
  Calculator,
  FileText,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import axios from "axios";
import ClientForm from "../../human-resources/clients/_components/client-Form";
import { QuotationSchema } from "@/lib/formValidationSchemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QuotationWithRelations } from "@/types/quotation";
import { Client, ShopProduct } from "@prisma/client";

type ComboboxOption = {
  label: string;
  value: string;
};

interface QuotationFormProps {
  type: "create" | "update";
  onCancel: () => void;
  onSubmitSuccess: () => void;
  data?: QuotationWithRelations;
  quotationId?: string;
}

interface CalculationSummary {
  subtotal: number;
  totalTax: number;
  discountAmount: number;
  depositAmount: number;
  totalAmount: number;
  amountDue: number;
}

export function QuotationForm({
  type,
  onCancel,
  onSubmitSuccess,
  data,
  quotationId,
}: QuotationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [productsOptions, setProductsOptions] = useState<ComboboxOption[]>([]);
  const [productsData, setProductsData] = useState<ShopProduct[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [calculations, setCalculations] = useState<CalculationSummary>({
    subtotal: 0,
    totalTax: 0,
    discountAmount: 0,
    depositAmount: 0,
    totalAmount: 0,
    amountDue: 0,
  });

  let depositAmount = 0;
  if (data?.depositType === "PERCENTAGE" && data?.depositAmount) {
    depositAmount = Number(data?.depositRate);
  } else {
    depositAmount = Number(data?.depositAmount);
  }

  const form = useForm<z.infer<typeof QuotationSchema>>({
    resolver: zodResolver(QuotationSchema),
    defaultValues: {
      clientId: data?.clientId || "",
      title: data?.title || "",
      issueDate: data?.issueDate
        ? new Date(data.issueDate).toISOString()
        : new Date().toISOString(),
      validUntil: data?.validUntil
        ? new Date(data.validUntil).toISOString()
        : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items:
        Array.isArray(data?.items) && data.items.length > 0
          ? data.items.map((item) => ({
              description: item.description || "",
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              taxRate: Number(item.taxRate),
              shopProductId: item.shopProductId || undefined,
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 0,
                shopProductId: undefined,
              },
            ],
      discountType: data?.discountType || undefined,
      discountAmount: data?.discountAmount
        ? Number(data?.discountAmount)
        : undefined,
      depositRequired: data?.depositRequired || false,
      depositType: data?.depositType || "PERCENTAGE",
      depositAmount: data?.depositAmount ? depositAmount : 30,
      description: data?.description || "",
      paymentTerms: data?.paymentTerms || "",
      notes: data?.notes || "",
    },
  });

  const calculateTotals = () => {
    const items = form.getValues("items");
    const discountType = form.getValues("discountType");
    const discountAmount = form.getValues("discountAmount") || 0;
    const depositRequired = form.getValues("depositRequired");
    const depositType = form.getValues("depositType");
    const depositAmount = form.getValues("depositAmount") || 0;

    // 1. Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // 2. Calculate discount
    let calculatedDiscount = 0;
    if (discountType === "PERCENTAGE" && discountAmount) {
      calculatedDiscount = subtotal * (discountAmount / 100);
    } else if (discountType === "AMOUNT" && discountAmount) {
      calculatedDiscount = discountAmount;
    }

    // Prevent discount from exceeding subtotal
    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    // 3. Calculate discounted subtotal
    const discountedSubtotal = subtotal - calculatedDiscount;

    // 4. Calculate tax on DISCOUNTED amount (proportionally per item)
    const discountRatio = subtotal > 0 ? calculatedDiscount / subtotal : 0;

    const totalTax = items.reduce((sum, item) => {
      const itemAmount = item.quantity * item.unitPrice;
      const discountedItemAmount = itemAmount - itemAmount * discountRatio;
      const itemTax = (discountedItemAmount * (item.taxRate || 0)) / 100;
      return sum + itemTax;
    }, 0);

    // 5. Total amount is discounted subtotal + tax
    const totalAmount = discountedSubtotal + totalTax;

    // 6. Calculate deposit
    let calculatedDeposit = 0;
    if (depositRequired) {
      if (depositType === "PERCENTAGE" && depositAmount) {
        calculatedDeposit = totalAmount * (depositAmount / 100);
      } else if (depositType === "AMOUNT" && depositAmount) {
        calculatedDeposit = depositAmount;
      }
    }

    const amountDue = totalAmount - calculatedDeposit;

    setCalculations({
      subtotal,
      totalTax,
      discountAmount: calculatedDiscount,
      depositAmount: calculatedDeposit,
      totalAmount,
      amountDue,
    });
  };

  // Calculate totals whenever form values change
  useEffect(() => {
    calculateTotals();
  }, [
    form.watch("items"),
    form.watch("discountType"),
    form.watch("discountAmount"),
    form.watch("depositRequired"),
    form.watch("depositType"),
    form.watch("depositAmount"),
  ]);

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

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchSettings();
  }, []);

  const onSubmit = async (values: z.infer<typeof QuotationSchema>) => {
    setIsLoading(true);
    try {
      // Prepare items with shop product IDs
      const itemsWithProductIds = values.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        shopProductId: item.shopProductId || null,
      }));

      const quotationData = {
        ...values,
        // REMOVED calculated fields - backend will handle these
        items: itemsWithProductIds,
      };

      const method = type === "create" ? "POST" : "PUT";
      const url =
        type === "create"
          ? "/api/quotations"
          : `/api/quotations/${quotationId}`;

      await axios({
        method,
        url,
        data: quotationData,
      });

      toast.success(
        `Quotation ${type === "create" ? "created" : "updated"} successfully`
      );
      onSubmitSuccess();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        description:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        shopProductId: undefined,
      },
    ]);
    // Recalculate totals after adding item
    setTimeout(calculateTotals, 0);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue(
        "items",
        items.filter((_, i) => i !== index)
      );
      // Recalculate totals after removing item
      setTimeout(calculateTotals, 0);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = productsData.find((p) => p.id === productId);
    if (selectedProduct) {
      form.setValue(
        `items.${index}.description`,
        `${selectedProduct.name} - ${selectedProduct.category}`
      );
      form.setValue(`items.${index}.unitPrice`, Number(selectedProduct.price));
      form.setValue(`items.${index}.shopProductId`, selectedProduct.id);
      form.setValue(`items.${index}.taxRate`, 15);
      // Recalculate totals after product selection
      setTimeout(calculateTotals, 0);
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

  // Real-time handlers for quantity, unit price, and tax rate changes
  const handleQuantityChange = (index: number, value: number) => {
    form.setValue(`items.${index}.quantity`, value);
    calculateTotals();
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    form.setValue(`items.${index}.unitPrice`, value);
    calculateTotals();
  };

  const handleTaxRateChange = (index: number, value: number) => {
    form.setValue(`items.${index}.taxRate`, value);
    calculateTotals();
  };

  const handleDiscountChange = (
    type: "AMOUNT" | "PERCENTAGE" | undefined,
    amount: number
  ) => {
    form.setValue("discountType", type);
    if (amount !== undefined) {
      form.setValue("discountAmount", amount);
    }
    calculateTotals();
  };

  const handleDepositChange = (
    required: boolean,
    type: "AMOUNT" | "PERCENTAGE",
    amount: number
  ) => {
    form.setValue("depositRequired", required);
    form.setValue("depositType", type);
    if (amount !== undefined) {
      form.setValue("depositAmount", amount);
    }
    calculateTotals();
  };

  const handleDateSelect = (
    fieldName: "issueDate" | "validUntil",
    date: Date | undefined
  ) => {
    if (date) {
      form.setValue(fieldName, date.toISOString());
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">
                {type === "create"
                  ? "Create a new quotation for your client"
                  : "Update the quotation details"}
              </p>
            </div>
          </div>

          {/* Client and Title */}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quotation Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Website Development Services"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                            format(new Date(field.value), "PPP")
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => handleDateSelect("issueDate", date)}
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
              name="validUntil"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Valid Until *</FormLabel>
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
                            format(new Date(field.value), "PPP")
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("validUntil", date)
                        }
                        disabled={(date) => {
                          const issueDate = form.getValues("issueDate");
                          return issueDate ? date < new Date(issueDate) : false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Quotation Items</h3>
              <p className="text-sm text-muted-foreground">
                Add products or services to your quotation
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
                    value={item.shopProductId || ""}
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
                          value={field.value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const finalValue = isNaN(value) ? 1 : value;
                            field.onChange(finalValue);
                            handleQuantityChange(index, finalValue);
                          }}
                          onBlur={field.onBlur}
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
                          value={field.value}
                          onChange={(e) => {
                            const value =
                              e.target.valueAsNumber ||
                              parseFloat(e.target.value) ||
                              0;
                            field.onChange(value);
                            handleUnitPriceChange(index, value);
                          }}
                          onBlur={field.onBlur}
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
                          value={field.value || ""}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value);
                            field.onChange(value);
                            handleTaxRateChange(index, value);
                          }}
                          onBlur={field.onBlur}
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

        {/* Discount, Deposit & Calculation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <Select
                      onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                        field.onChange(value);
                        handleDiscountChange(
                          value,
                          form.getValues("discountAmount") || 0
                        );
                      }}
                      value={field.value}
                    >
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
                              handleDiscountChange(
                                form.getValues("discountType"),
                                0
                              );
                              return;
                            }
                            let value = parseFloat(input);
                            if (isNaN(value)) {
                              field.onChange(undefined);
                              handleDiscountChange(
                                form.getValues("discountType"),
                                0
                              );
                              return;
                            }
                            if (
                              form.watch("discountType") === "PERCENTAGE" &&
                              value > 100
                            ) {
                              value = 100;
                            }
                            field.onChange(value);
                            handleDiscountChange(
                              form.getValues("discountType"),
                              value
                            );
                          }}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Deposit</h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="depositRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Deposit
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Request a deposit payment from the client
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleDepositChange(
                            checked,
                            form.getValues("depositType") || "PERCENTAGE",
                            form.getValues("depositAmount") || 50
                          );
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("depositRequired") && (
                <>
                  <FormField
                    control={form.control}
                    name="depositType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Type</FormLabel>
                        <Select
                          onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                            field.onChange(value);
                            handleDepositChange(
                              true,
                              value,
                              form.getValues("depositAmount") || 50
                            );
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deposit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">
                              Percentage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Deposit Amount{" "}
                          {form.watch("depositType") === "PERCENTAGE"
                            ? "(%)"
                            : ""}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step={
                              form.watch("depositType") === "PERCENTAGE"
                                ? "1"
                                : "0.01"
                            }
                            placeholder={
                              form.watch("depositType") === "PERCENTAGE"
                                ? "50"
                                : "0.00"
                            }
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const input = e.target.value;
                              if (input === "") {
                                field.onChange(undefined);
                                handleDepositChange(
                                  true,
                                  form.getValues("depositType") || "PERCENTAGE",
                                  0
                                );
                                return;
                              }
                              let value = parseFloat(input);
                              if (isNaN(value)) {
                                field.onChange(undefined);
                                handleDepositChange(
                                  true,
                                  form.getValues("depositType") || "PERCENTAGE",
                                  0
                                );
                                return;
                              }
                              if (
                                form.watch("depositType") === "PERCENTAGE" &&
                                value > 100
                              ) {
                                value = 100;
                              }
                              field.onChange(value);
                              handleDepositChange(
                                true,
                                form.getValues("depositType") || "PERCENTAGE",
                                value
                              );
                            }}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
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

              {/* Deposit Section */}
              {form.watch("depositRequired") &&
                calculations.depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 border-t pt-3">
                      <span>Deposit:</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.depositAmount)}
                        {form.watch("depositType") === "PERCENTAGE" &&
                          ` (${form.getValues("depositAmount")}%)`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-3">
                      <span>Amount Due:</span>
                      <span className="text-blue-600">
                        {formatCurrency(calculations.amountDue)}
                      </span>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* Description & Terms */}
        <div className="bg-card border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Additional Information</h4>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the quotation..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {type === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              `${type === "create" ? "Create" : "Update"} Quotation`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
