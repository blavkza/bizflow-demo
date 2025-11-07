"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExpenseFormValues, expenseSchema } from "@/lib/formValidationSchemas";
import { ComboboxOption } from "../types";
import { useState, useEffect } from "react";
import { VendorFormData } from "../../suppliers/type";
import {
  NO_CATEGORY_VALUE,
  NO_PAYMENT_TERMS_VALUE,
} from "../../suppliers/utils";
import { VendorForm } from "../../suppliers/components/VendorForm";

// Add Vendor Dialog Component
function AddVendorDialog({ onVendorAdded }: { onVendorAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: VendorFormData) => {
    setLoading(true);

    try {
      const apiData = {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        taxNumber: data.taxNumber?.trim() || null,
        category:
          data.category === NO_CATEGORY_VALUE ? null : data.category?.trim(),
        paymentTerms:
          data.paymentTerms === NO_PAYMENT_TERMS_VALUE
            ? null
            : data.paymentTerms?.trim(),
        notes: data.notes?.trim() || null,
        status: "ACTIVE",
        tags: [],
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create vendor");
      }

      await response.json();
      toast.success("Vendor created successfully");
      setIsOpen(false);
      onVendorAdded();
    } catch (error) {
      console.error("Failed to create vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create vendor"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="h-3 w-3 mr-1" />
          New Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor or supplier to your system.
          </DialogDescription>
        </DialogHeader>

        {/* Use the imported VendorForm component */}
        <VendorForm onSubmit={handleSubmit} loading={loading} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
  categoriesOptions: ComboboxOption[];
  vendorsOptions: ComboboxOption[];
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  onExpenseAdded,
  categoriesOptions,
  vendorsOptions,
}: AddExpenseDialogProps) {
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<ComboboxOption[]>(vendorsOptions);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      categoryId: "",
      vendorId: "",
      totalAmount: 0,
      paidAmount: 0,
      expenseDate: new Date(),
      dueDate: new Date(),
      priority: "MEDIUM",
      status: "PENDING",
      paymentMethod: "",
      invoiceId: "",
      projectId: "",
    },
  });

  // Watch the amount fields to calculate remaining balance
  const totalAmount = form.watch("totalAmount");
  const paidAmount = form.watch("paidAmount");
  const remainingAmount = totalAmount - paidAmount;

  // Fetch invoices and projects when dialog opens
  const fetchInvoicesAndProjects = async () => {
    try {
      setIsLoading(true);
      const [invoicesRes, projectsRes] = await Promise.all([
        axios.get("/api/invoices"),
        axios.get("/api/projects"),
      ]);

      setInvoicesOptions(
        invoicesRes.data.map((invoice: any) => ({
          label: invoice.invoiceNumber,
          value: invoice.id,
        }))
      );

      setProjectsOptions(
        projectsRes.data.map((project: any) => ({
          label: project.title,
          value: project.id,
        }))
      );
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Refresh vendors list
  const refreshVendors = async () => {
    try {
      const vendorsRes = await axios.get("/api/vendors");
      setVendors(
        vendorsRes.data.map((vendor: any) => ({
          label: vendor.name,
          value: vendor.id,
        }))
      );
    } catch (error) {
      console.error("Error refreshing vendors:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInvoicesAndProjects();
      refreshVendors(); // Refresh vendors when dialog opens
    }
  }, [open]);

  const handleInvoiceChange = (invoiceId: string) => {
    form.setValue("invoiceId", invoiceId);
    form.setValue("projectId", "");
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await axios.post("/api/expenses", data);
      toast.success("Expense created successfully");
      onOpenChange(false);
      form.reset();
      onExpenseAdded();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a new business expense with payment details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Expense description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Field with Add New Button */}
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Vendor</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={vendors}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select vendor"
                        />
                      </div>
                      <AddVendorDialog onVendorAdded={refreshVendors} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Category</FormLabel>
                    <Combobox
                      options={categoriesOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select category"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remaining Balance Display */}
                <FormItem className="space-y-1">
                  <FormLabel>Remaining Balance</FormLabel>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <span
                      className={cn(
                        "flex items-center",
                        remainingAmount > 0
                          ? "text-orange-600 font-medium"
                          : remainingAmount < 0
                            ? "text-red-600 font-medium"
                            : "text-green-600 font-medium"
                      )}
                    >
                      R{remainingAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {remainingAmount > 0
                      ? "Outstanding amount"
                      : remainingAmount < 0
                        ? "Overpayment detected"
                        : "Fully paid"}
                  </p>
                </FormItem>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Expense Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>When occurred?</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                    <FormItem className="space-y-1">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>When due?</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Field */}
              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Invoice</FormLabel>
                    <Combobox
                      options={invoicesOptions}
                      value={field.value || ""}
                      onChange={handleInvoiceChange}
                      placeholder="Select invoice"
                      isLoading={isLoading}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
