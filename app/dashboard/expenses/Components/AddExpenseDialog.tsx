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
import {
  Plus,
  Loader2,
  CalendarIcon,
  UploadCloud,
  X,
  FileText,
  ImageIcon,
  Edit,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExpenseFormValues, expenseSchema } from "@/lib/formValidationSchemas";
import { ComboboxOption, Expense } from "../types";
import { useState, useEffect, useRef, useCallback } from "react";
import { VendorForm } from "../../suppliers/components/VendorForm";
import CategoryForm from "../../categories/_components/category-Form";

function AddVendorDialog({ onVendorAdded }: { onVendorAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);

    try {
      // Parse payment terms to extract number of days from various formats
      let paymentTermsDays = null;
      if (data.paymentTerms && data.paymentTerms !== "no-payment-terms") {
        const paymentTerms = data.paymentTerms.trim();

        // Format 1: "net-30" or "net 30"
        let match = paymentTerms.toLowerCase().match(/net[- ]?(\d+)/);
        if (match) {
          paymentTermsDays = parseInt(match[1], 10);
        }

        // Format 2: "Payment In 30 days" or similar
        if (!paymentTermsDays) {
          match = paymentTerms.match(/(?:payment|pay)[\w\s]*(\d+)[\w\s]*day/i);
          if (match) {
            paymentTermsDays = parseInt(match[1], 10);
          }
        }

        // Format 3: Extract any number
        if (!paymentTermsDays) {
          match = paymentTerms.match(/(\d+)/);
          if (match) {
            paymentTermsDays = parseInt(match[1], 10);
          }
        }
      }

      const apiData = {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim(),
        phone2: data.phone2?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        taxNumber: data.taxNumber?.trim() || null,
        registrationNumber: data.registrationNumber?.trim() || null,
        categoryIds: data.categoryIds || [],
        type: data.type || "SUPPLIER",
        status: data.status || "ACTIVE",
        paymentTerms:
          data.paymentTerms === "no-payment-terms"
            ? null
            : data.paymentTerms?.trim(),
        paymentTermsDays: paymentTermsDays,
        notes: data.notes?.trim() || null,
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

// AddCategoryDialog Component
function AddCategoryDialog({
  onCategoryAdded,
}: {
  onCategoryAdded: () => void;
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="h-3 w-3 mr-1" />
          New Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new expense category for better organization.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          type="create"
          onCancel={() => setIsAddDialogOpen(false)}
          onSubmitSuccess={() => {
            setIsAddDialogOpen(false);
            onCategoryAdded();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// Main Add/Edit Expense Dialog Component
interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
  categoriesOptions: ComboboxOption[];
  vendorsOptions: ComboboxOption[];
  vendorsData: any[];
  defaultVendorId?: string;
  mode?: "add" | "edit";
  expenseData?: Expense | null;
  initialInvoicesOptions?: ComboboxOption[];
  initialProjectsOptions?: ComboboxOption[];
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  onExpenseAdded,
  categoriesOptions,
  vendorsOptions,
  vendorsData,
  defaultVendorId,
  mode = "add",
  expenseData = null,
  initialInvoicesOptions = [],
  initialProjectsOptions = [],
}: AddExpenseDialogProps) {
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>(
    initialInvoicesOptions
  );
  const [projectsOptions, setProjectsOptions] = useState<ComboboxOption[]>(
    initialProjectsOptions
  );
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<ComboboxOption[]>(vendorsOptions);
  const [categories, setCategories] =
    useState<ComboboxOption[]>(categoriesOptions);
  const [fullVendorsData, setFullVendorsData] = useState<any[]>(
    vendorsData || []
  );
  const [selectedVendorPaymentTerms, setSelectedVendorPaymentTerms] = useState<
    number | null
  >(null);
  const [isManualDueDate, setIsManualDueDate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Add refs to track state
  const isManualSelectionRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      categoryId: "",
      vendorId: defaultVendorId || "",
      totalAmount: 0,
      paidAmount: 0,
      expenseDate: new Date(),
      dueDate: new Date(),
      priority: "MEDIUM",
      status: "PENDING",
      paymentMethod: "",
      invoiceId: "",
      projectId: "",
      attachments: [],
    },
  });

  // Watchers
  const totalAmount = form.watch("totalAmount");
  const paidAmount = form.watch("paidAmount");
  const expenseDate = form.watch("expenseDate");
  const vendorId = form.watch("vendorId");
  const remainingAmount = totalAmount - paidAmount;
  const attachments = form.watch("attachments") || [];

  // Function to get vendor payment terms from local data
  const getVendorPaymentTerms = useCallback(
    (vendorId: string) => {
      if (!vendorId || !fullVendorsData || fullVendorsData.length === 0) {
        setSelectedVendorPaymentTerms(null);
        return;
      }

      const vendor = fullVendorsData.find((v) => v.id === vendorId);

      if (!vendor) {
        setSelectedVendorPaymentTerms(null);
        return;
      }

      if (vendor.paymentTermsDays) {
        setSelectedVendorPaymentTerms(vendor.paymentTermsDays);
      } else if (vendor.paymentTerms) {
        // Try multiple formats
        let days = null;

        // Format 1: "net-30" or "net 30"
        let match = vendor.paymentTerms.toLowerCase().match(/net[- ]?(\d+)/);
        if (match) {
          days = parseInt(match[1], 10);
        }

        // Format 2: "Payment In 30 days" or "Payment within 30 days"
        if (!days) {
          match = vendor.paymentTerms.match(
            /(?:payment|pay)[\w\s]*(\d+)[\w\s]*day/i
          );
          if (match) {
            days = parseInt(match[1], 10);
          }
        }

        // Format 3: Extract any number from the string
        if (!days) {
          match = vendor.paymentTerms.match(/(\d+)/);
          if (match) {
            days = parseInt(match[1], 10);
          }
        }

        setSelectedVendorPaymentTerms(days);
      } else {
        setSelectedVendorPaymentTerms(null);
      }
    },
    [fullVendorsData]
  );

  // Functions to fetch data
  const fetchInvoicesAndProjects = useCallback(async () => {
    // If we already have data from props, use it
    if (
      initialInvoicesOptions.length > 0 &&
      initialProjectsOptions.length > 0
    ) {
      return;
    }

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
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [initialInvoicesOptions.length, initialProjectsOptions.length]);

  const refreshVendors = useCallback(async () => {
    try {
      const vendorsRes = await axios.get("/api/vendors");
      const newVendors = vendorsRes.data.map((vendor: any) => ({
        label: vendor.name,
        value: vendor.id,
      }));
      setVendors(newVendors);
      setFullVendorsData(vendorsRes.data);
    } catch (error) {
      toast.error("Failed to refresh vendors");
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const categoriesRes = await axios.get("/api/category/all-category");
      const newCategories = categoriesRes.data.map((category: any) => ({
        label: category.name,
        value: category.id,
      }));
      setCategories(newCategories);
    } catch (error) {
      toast.error("Failed to refresh categories");
    }
  }, []);

  // Initialize form when dialog opens
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false;
      return;
    }

    // Only initialize once when dialog opens
    if (!hasInitializedRef.current && open) {
      hasInitializedRef.current = true;

      if (mode === "edit" && expenseData) {
        // Format dates properly for edit mode
        const expenseDateValue = expenseData.expenseDate
          ? new Date(expenseData.expenseDate)
          : new Date();

        const dueDateValue = expenseData.dueDate
          ? new Date(expenseData.dueDate)
          : new Date();

        const paidDateValue = expenseData.paidDate
          ? new Date(expenseData.paidDate)
          : null;

        form.reset({
          description: expenseData.description || "",
          categoryId: expenseData.categoryId || "",
          vendorId: expenseData.vendorId || "",
          totalAmount: expenseData.totalAmount || 0,
          paidAmount: expenseData.paidAmount || 0,
          expenseDate: expenseDateValue,
          dueDate: dueDateValue,
          priority: expenseData.priority || "MEDIUM",
          status: expenseData.status || "PENDING",
          paymentMethod: expenseData.paymentMethod || "",
          invoiceId: expenseData.invoiceId || "",
          projectId: expenseData.projectId || "",
          attachments: [],
          notes: expenseData.notes || "",

          paidDate: paidDateValue,
        });

        // Get vendor payment terms
        if (expenseData.vendorId) {
          getVendorPaymentTerms(expenseData.vendorId);
        }
      } else {
        // Add mode
        const initialExpenseDate = new Date();
        const initialDueDate = new Date();

        form.reset({
          description: "",
          categoryId: "",
          vendorId: defaultVendorId || "",
          totalAmount: 0,
          paidAmount: 0,
          expenseDate: initialExpenseDate,
          dueDate: initialDueDate,
          priority: "MEDIUM",
          status: "PENDING",
          paymentMethod: "",
          invoiceId: "",
          projectId: "",
          attachments: [],
          notes: "",
          vendorEmail: "",
          vendorPhone: "",
          paidDate: null,
          accountCode: "",
          projectCode: "",
        });

        // Fetch payment terms if default vendor is set
        if (defaultVendorId) {
          getVendorPaymentTerms(defaultVendorId);
        }
      }

      // Fetch data if needed
      if (
        initialInvoicesOptions.length === 0 ||
        initialProjectsOptions.length === 0
      ) {
        fetchInvoicesAndProjects();
      }

      // Always refresh vendors and categories to ensure we have latest data
      refreshVendors();
      refreshCategories();
    }
  }, [
    open,
    mode,
    expenseData,
    defaultVendorId,
    form,
    getVendorPaymentTerms,
    initialInvoicesOptions.length,
    initialProjectsOptions.length,
    fetchInvoicesAndProjects,
    refreshVendors,
    refreshCategories,
  ]);

  // Update vendors and categories from props when they change
  useEffect(() => {
    setVendors(vendorsOptions);
  }, [vendorsOptions]);

  useEffect(() => {
    setCategories(categoriesOptions);
  }, [categoriesOptions]);

  // Update full vendors data when props change
  useEffect(() => {
    setFullVendorsData(vendorsData);
  }, [vendorsData]);

  // Get vendor payment terms when vendor changes
  useEffect(() => {
    if (vendorId) {
      getVendorPaymentTerms(vendorId);
      // Reset manual flag when vendor changes
      setIsManualDueDate(false);
      isManualSelectionRef.current = false;
    } else {
      setSelectedVendorPaymentTerms(null);
    }
  }, [vendorId, getVendorPaymentTerms]);

  // Auto-calculate due date when expense date or payment terms change
  useEffect(() => {
    // Skip if we just manually selected
    if (isManualSelectionRef.current) {
      isManualSelectionRef.current = false;
      return;
    }

    if (isManualDueDate) {
      return;
    }

    if (!expenseDate || !selectedVendorPaymentTerms) {
      return;
    }

    try {
      const calculatedDueDate = addDays(
        new Date(expenseDate),
        selectedVendorPaymentTerms
      );

      // Get current due date
      const currentDueDate = form.getValues("dueDate");

      // Only update if the calculated date is different from current
      if (
        !currentDueDate ||
        format(new Date(currentDueDate), "yyyy-MM-dd") !==
          format(calculatedDueDate, "yyyy-MM-dd")
      ) {
        form.setValue("dueDate", calculatedDueDate, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    } catch (error) {
      console.error("Error calculating due date:", error);
    }
  }, [expenseDate, selectedVendorPaymentTerms, isManualDueDate, form]);

  const handleInvoiceChange = (invoiceId: string) => {
    form.setValue("invoiceId", invoiceId);
    form.setValue("projectId", "");
  };

  // Handle expense date selection
  const handleExpenseDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("expenseDate", date, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  // Handle due date selection manually
  const handleDueDateSelect = (date: Date | undefined) => {
    if (date) {
      // Set the ref to indicate manual selection
      isManualSelectionRef.current = true;
      setIsManualDueDate(true);

      form.setValue("dueDate", date, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  // Apply payment terms button handler
  const handleApplyPaymentTerms = () => {
    if (expenseDate && selectedVendorPaymentTerms) {
      const calculatedDueDate = addDays(
        new Date(expenseDate),
        selectedVendorPaymentTerms
      );

      // Reset manual selection flag when applying payment terms
      isManualSelectionRef.current = false;
      setIsManualDueDate(false);

      form.setValue("dueDate", calculatedDueDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      toast.success(`Due date set to ${format(calculatedDueDate, "PPP")}`);
    }
  };

  // File Upload Logic - only for add mode
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === "edit") return; // Don't handle attachments in edit mode

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expenseId", "temp");

    try {
      const uploadResponse = await axios.post(
        "/api/expenses/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const attachmentData = uploadResponse.data;

      // Update form value
      const currentAttachments = form.getValues("attachments") || [];
      form.setValue("attachments", [...currentAttachments, attachmentData]);

      toast.success("File attached successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    if (mode === "edit") return; // Don't remove attachments in edit mode

    const currentAttachments = form.getValues("attachments") || [];
    const newAttachments = currentAttachments.filter(
      (_, index) => index !== indexToRemove
    );
    form.setValue("attachments", newAttachments);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const formData = {
        ...data,
        totalAmount:
          typeof data.totalAmount === "string"
            ? parseFloat(data.totalAmount)
            : data.totalAmount,
        paidAmount:
          typeof data.paidAmount === "string"
            ? parseFloat(data.paidAmount)
            : data.paidAmount,
      };

      if (mode === "edit" && expenseData?.id) {
        await axios.put(`/api/expenses/${expenseData.id}`, formData);
        toast.success("Expense updated successfully");
      } else {
        await axios.post("/api/expenses", formData);
        toast.success("Expense created successfully");
      }

      onOpenChange(false);
      form.reset();
      onExpenseAdded();
    } catch (error) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "creating"} expense:`,
        error
      );
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} expense`);
    }
  };

  // Determine dialog title and button text based on mode
  const dialogTitle = mode === "edit" ? "Edit Expense" : "Add New Expense";
  const dialogDescription =
    mode === "edit"
      ? "Update the expense details."
      : "Record a new business expense with payment details.";
  const submitButtonText = mode === "edit" ? "Update Expense" : "Add Expense";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {mode === "add" && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </DialogTrigger>
      )}
      {mode === "edit" && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
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
                          onChange={(value) => {
                            field.onChange(value);
                            // Clear manual due date flag when selecting a new vendor
                            setIsManualDueDate(false);
                            isManualSelectionRef.current = false;
                          }}
                          placeholder="Select vendor"
                        />
                      </div>
                      <AddVendorDialog onVendorAdded={refreshVendors} />
                    </div>
                    <FormMessage />
                    {selectedVendorPaymentTerms && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Payment terms: Net {selectedVendorPaymentTerms} days
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Category Field with Add New Button */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Category</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={categories}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select category"
                        />
                      </div>
                      <AddCategoryDialog onCategoryAdded={refreshCategories} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div
                className={cn(
                  `grid  gap-4`,
                  mode === "edit" ? `grid-cols-2` : `grid-cols-3`
                )}
              >
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
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? "0" : value);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const numValue =
                              value === "" ? 0 : parseFloat(value);
                            field.onChange(
                              isNaN(numValue) ? "0" : numValue.toString()
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode !== "edit" && (
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
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "0" : value);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              const numValue =
                                value === "" ? 0 : parseFloat(value);
                              field.onChange(
                                isNaN(numValue) ? "0" : numValue.toString()
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                                <span>Select date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={handleExpenseDateSelect}
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
                      <div className="flex gap-2">
                        <div className="flex-1">
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
                                    <span>Select date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={handleDueDateSelect}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {selectedVendorPaymentTerms && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleApplyPaymentTerms}
                            title={`Set due date to net ${selectedVendorPaymentTerms} days from expense date`}
                            disabled={!expenseDate}
                          >
                            Apply Net {selectedVendorPaymentTerms}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                      {selectedVendorPaymentTerms &&
                        expenseDate &&
                        !isManualDueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Auto-calculated from expense date +{" "}
                            {selectedVendorPaymentTerms} days
                          </p>
                        )}
                      {isManualDueDate && (
                        <p className="text-xs text-blue-500 mt-1">
                          Manually set date
                        </p>
                      )}
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

              {/* === ATTACHMENT SECTION === */}
              {/* Only show attachment section in add mode */}
              {mode === "add" && (
                <div className="space-y-2">
                  <FormLabel>Receipt / Attachment</FormLabel>
                  <div className="flex flex-col gap-3">
                    {/* Hidden Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />

                    {/* Upload Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-dashed border-2 flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isUploading
                          ? "Uploading..."
                          : "Click to upload receipt or document"}
                      </span>
                    </Button>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {attachments.map((file: any, index: number) => (
                          <div
                            key={file.id || index}
                            className="flex items-center justify-between p-2 border rounded-md bg-muted/20"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {file.type === "IMAGE" ? (
                                <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                              )}
                              <span className="text-sm truncate max-w-[200px]">
                                {file.filename}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || (mode === "add" && isUploading)
                }
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  submitButtonText
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
