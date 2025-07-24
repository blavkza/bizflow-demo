"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, X, Plus } from "lucide-react";
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
  Product,
} from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import { InvoiceSchema } from "@/lib/formValidationSchemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/app/dashboard/human-resources/clients/_components/client-Form";

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
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
      const response = await axios.get("/api/products");
      const products: Product[] = response?.data || [];
      setProductsData(products);
      const options = products
        .filter((product) => product.id && product.category)
        .map((product) => ({
          label: `${product.category} (${product.size}) ${product.panels === null ? "" : product.panels} - R${Number(product.price || 0).toFixed(2)}`,
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
      console.log(defaultSetting);

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

  const form = useForm<z.infer<typeof InvoiceSchema>>({
    resolver: zodResolver(InvoiceSchema),
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
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 0,
              },
            ],
      discountType: data?.invoice?.discountType || undefined,
      discountAmount: data?.invoice?.discountAmount
        ? Number(data?.invoice?.discountAmount)
        : undefined,
      paymentTerms: data?.invoice?.paymentTerms || "",
      notes: data?.invoice?.notes || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof InvoiceSchema>) => {
    try {
      const itemsWithAmounts = values.items.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
        taxAmount: item.taxRate
          ? (item.quantity * item.unitPrice * item.taxRate) / 100
          : 0,
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
        discountAmount = subtotal * (values.discountAmount / 100);
      } else if (values.discountType === "AMOUNT" && values.discountAmount) {
        discountAmount = values.discountAmount;
      }

      const totalAmount = subtotal + totalTax - discountAmount;

      const totalItemTaxRates = itemsWithAmounts.reduce(
        (sum, item) => sum + (item.taxRate || 0),
        0
      );
      const taxRate =
        itemsWithAmounts.length > 0
          ? totalItemTaxRates / itemsWithAmounts.length
          : 0;

      const invoiceData = {
        ...values,
        amount: subtotal,
        taxAmount: totalTax,
        taxRate,
        discountAmount,
        totalAmount,
        items: itemsWithAmounts,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };

      if (type === "create") {
        await axios.post("/api/invoices", invoiceData);
        toast.success("Invoice created successfully");
      } else {
        await axios.put(`/api/invoices/${data.invoice.id}`, invoiceData);
        toast.success("Invoice updated successfully");
      }

      onSubmitSuccess();
    } catch (error) {
      toast.error(
        `Something went wrong while ${
          type === "create" ? "creating" : "updating"
        } the invoice`
      );
      console.error("Invoice error:", error);
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Client</FormLabel>
                  <div className="flex w-full gap-2">
                    <FormControl className="w-full">
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Due Date</FormLabel>
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
                        disabled={(date) => date < form.getValues("issueDate")}
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
                <FormItem>
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
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
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
                            min="0.01"
                            step="0.01"
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
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                              handleManualItemChange(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
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
                        <SelectValue placeholder="No discount" />
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
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={
                          form.watch("discountType") === "PERCENTAGE"
                            ? "0.00%"
                            : "0.00"
                        }
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
            )}
          </div>

          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Payment terms and conditions"
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
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex justify-end gap-4">
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
                `${type === "create" ? "Create" : "Update"} Invoice`
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
