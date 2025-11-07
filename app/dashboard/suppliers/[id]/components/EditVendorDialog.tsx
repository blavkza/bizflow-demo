"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  category: string | null;
  paymentTerms: string | null;
  notes: string | null;
  status: string;
  tags: string[];
}

interface EditVendorDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: () => void;
}

const VENDOR_CATEGORIES = [
  "Technology",
  "Office Supplies",
  "Professional Services",
  "Marketing",
  "Utilities",
  "Travel",
  "Maintenance",
  "Insurance",
  "Legal",
  "Consulting",
  "Software",
  "Hardware",
  "Other",
];

const PAYMENT_TERMS = [
  "Due on receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "2/10 Net 30",
  "50% Advance, 50% on completion",
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "default" },
  { value: "INACTIVE", label: "Inactive", color: "secondary" },
  { value: "PENDING", label: "Pending", color: "outline" },
];

// Use non-empty values for "no selection"
const NO_CATEGORY_VALUE = "no-category";
const NO_PAYMENT_TERMS_VALUE = "no-payment-terms";

// Zod schema for form validation
const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  category: z.string().default(NO_CATEGORY_VALUE),
  paymentTerms: z.string().default(NO_PAYMENT_TERMS_VALUE),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
  tags: z.array(z.string()).default([]),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export function EditVendorDialog({
  vendor,
  open,
  onOpenChange,
  onVendorUpdated,
}: EditVendorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      taxNumber: "",
      category: NO_CATEGORY_VALUE,
      paymentTerms: NO_PAYMENT_TERMS_VALUE,
      notes: "",
      status: "ACTIVE",
      tags: [],
    },
  });

  // Watch form values
  const { watch, setValue, reset } = form;
  const formValues = watch();

  // Initialize form data when vendor changes or dialog opens
  useEffect(() => {
    if (vendor && open) {
      reset({
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        website: vendor.website || "",
        address: vendor.address || "",
        taxNumber: vendor.taxNumber || "",
        category: vendor.category || NO_CATEGORY_VALUE,
        paymentTerms: vendor.paymentTerms || NO_PAYMENT_TERMS_VALUE,
        notes: vendor.notes || "",
        status:
          (vendor.status as "ACTIVE" | "INACTIVE" | "PENDING") || "ACTIVE",
        tags: vendor.tags || [],
      });
      setTagsInput(vendor.tags?.join(", ") || "");
    }
  }, [vendor, open, reset]);

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setValue("tags", tagsArray);
  };

  const removeTag = (indexToRemove: number) => {
    const newTags =
      formValues.tags?.filter((_, index) => index !== indexToRemove) || [];
    setValue("tags", newTags);
    setTagsInput(newTags.join(", "));
  };

  const onSubmit = async (data: VendorFormData) => {
    setLoading(true);

    try {
      // Prepare data for API - convert special values to null for optional fields
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
        status: data.status,
        tags: data.tags || [],
      };

      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update vendor");
      }

      const updatedVendor = await response.json();
      toast.success("Vendor updated successfully");
      onVendorUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update vendor"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      (statusOption?.color as
        | "default"
        | "secondary"
        | "outline"
        | "destructive") || "outline"
    );
  };

  // Helper to get display text for Select values
  const getDisplayValue = (value: string) => {
    if (value === NO_CATEGORY_VALUE) return "No Category";
    if (value === NO_PAYMENT_TERMS_VALUE) return "No specific terms";
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Update vendor information and details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Vendor Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vendor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {getDisplayValue(field.value)}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_CATEGORY_VALUE}>
                              No Category
                            </SelectItem>
                            {VENDOR_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <SelectTrigger>
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getStatusBadgeVariant(field.value)}
                                >
                                  {STATUS_OPTIONS.find(
                                    (s) => s.value === field.value
                                  )?.label || "Active"}
                                </Badge>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <Badge variant={status.color as any}>
                                  {status.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="vendor@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+27 12 345 6789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full physical address"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Financial & Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Financial & Additional Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Tax Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax/VAT number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Payment Terms</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {getDisplayValue(field.value)}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_PAYMENT_TERMS_VALUE}>
                              No specific terms
                            </SelectItem>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term} value={term}>
                                {term}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>
                    Tags{" "}
                    <span className="text-sm text-muted-foreground">
                      (comma-separated)
                    </span>
                  </FormLabel>
                  <Input
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="supplier, tech, urgent, etc."
                  />
                  {formValues.tags && formValues.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formValues.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this vendor..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Vendor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
