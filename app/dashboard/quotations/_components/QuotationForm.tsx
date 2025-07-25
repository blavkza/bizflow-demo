"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
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
import { QuotationWithRelations } from "@/types/quotation";
import { Client, DiscountType, GeneralSetting, Product } from "@prisma/client";

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
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 0,
              },
            ],
      discountType: data?.discountType || undefined,
      discountAmount: data?.discountAmount
        ? Number(data?.discountAmount)
        : undefined,
      description: data?.description || "",
      paymentTerms: data?.paymentTerms || "",
      notes: data?.notes || "",
    },
  });

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
      console.log(defaultSetting);

      return data;
    } catch (error) {
      console.error("Failed to fetch settings", error);
      return null;
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await axios.get("/api/products");
      const products: Product[] = response?.data || [];
      setProductsData(products);
      const options = products
        .filter((product) => product.id && product.category)
        .map((product) => ({
          label: `${product.category} (${product.size}) ${product.panels === null ? "" : product.panels}  - R${Number(product.price || 0).toFixed(2)}`,
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
      const issueDate = new Date(values.issueDate);
      const validUntil = new Date(values.validUntil);

      const itemsWithAmounts = values.items.map((item) => ({
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

      let discountAmount = 0;
      if (values.discountType === "PERCENTAGE" && values.discountAmount) {
        discountAmount = (subtotal + totalTax) * (values.discountAmount / 100);
      } else if (values.discountType === "AMOUNT" && values.discountAmount) {
        discountAmount = values.discountAmount;
      }

      const totalAmount = subtotal + totalTax - discountAmount;

      const quotationData = {
        ...values,
        amount: subtotal,
        taxAmount: totalTax,
        totalAmount,
        items: itemsWithAmounts,
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
    form.setValue("items", [
      ...form.getValues("items"),
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
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
    const selectedProduct = productsData.find((p) => p.id === productId);
    if (selectedProduct) {
      form.setValue(
        `items.${index}.description`,
        `${selectedProduct.category}${selectedProduct.size ? ` (${selectedProduct.size})` : ""}${selectedProduct.panels ? ` ${selectedProduct.panels + " " + "Panels"}` : ""}`
      );
      form.setValue(`items.${index}.unitPrice`, Number(selectedProduct.price));
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

  const handleDateSelect = (
    fieldName: "issueDate" | "validUntil",
    date: Date | undefined
  ) => {
    if (date) {
      form.setValue(fieldName, date.toISOString());
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        {/* Client and Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
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
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Quotation title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
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
                      selected={field.value ? new Date(field.value) : undefined}
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
                <FormLabel>Valid Until</FormLabel>
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
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => handleDateSelect("validUntil", date)}
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

        {/* Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {form.watch("discountType") === "PERCENTAGE" ? "(%)" : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="1.00"
                      placeholder={
                        form.watch("discountType") === "PERCENTAGE"
                          ? "0.00%"
                          : "0.00"
                      }
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const input = e.target.value;

                        // Allow backspace to clear the input
                        if (input === "") {
                          field.onChange(undefined);
                          return;
                        }

                        let value = parseFloat(input);

                        if (isNaN(value)) {
                          field.onChange(undefined);
                          return;
                        }

                        // Clamp to max = 10
                        if (value > 10) {
                          value = 10;
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

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {form.watch("items").map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end p-2 border rounded-lg"
              >
                {/* Product Combobox */}
                <div className="col-span-4">
                  <FormLabel className={index > 0 ? "sr-only" : ""}>
                    Product (or enter manually below)
                  </FormLabel>
                  <Combobox
                    options={productsOptions}
                    value=""
                    onChange={(value) => handleProductSelect(index, value)}
                    isLoading={isLoadingProducts}
                    placeholder="Select a product (optional)"
                  />
                </div>

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel className={index > 0 ? "sr-only" : ""}>
                        Description
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Item description"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleManualItemChange(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quantity Field */}
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className={index > 0 ? "sr-only" : ""}>
                        Qty
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price Field */}
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className={index > 0 ? "sr-only" : ""}>
                        Price
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseFloat(val)
                            );
                            handleManualItemChange(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate Field */}
                <FormField
                  control={form.control}
                  name={`items.${index}.taxRate`}
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className={index > 0 ? "sr-only" : ""}>
                        Tax (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0.00%"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseFloat(val)
                            );
                            handleManualItemChange(index);
                          }}
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
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Quotation description..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Payment terms..."
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
                    placeholder="Additional notes..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${type === "create" ? "Create" : "Update"} Quotation`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
