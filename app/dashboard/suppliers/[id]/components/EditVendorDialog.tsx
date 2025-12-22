"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VendorForm } from "../../components/VendorForm";
import { VendorFormData } from "../../type";

interface Vendor {
  id: string;
  name: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  phone2?: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  registrationNumber?: string | null;
  categories:
    | string[]
    | { id: string; name: string; description: string | null }[];
  type: string;
  paymentTerms: string | null;
  notes: string | null;
  status: string;
}

interface EditVendorDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: () => void;
}

export function EditVendorDialog({
  vendor,
  open,
  onOpenChange,
  onVendorUpdated,
}: EditVendorDialogProps) {
  const [loading, setLoading] = useState(false);

  // Helper function to get category IDs from vendor categories
  const getCategoryIds = (categories: Vendor["categories"]): string[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) {
      if (categories.length === 0) return [];
      if (typeof categories[0] === "string") {
        // Categories is string[] - we need to convert to IDs
        // For strings, we'll need to fetch categories to get IDs
        return []; // We'll handle this differently
      } else {
        // Categories is ProductCategory[]
        return (categories as { id: string }[]).map((cat) => cat.id);
      }
    }
    return [];
  };

  // Prepare default values for the form
  const getDefaultValues = (): VendorFormData | undefined => {
    if (!vendor) return undefined;

    return {
      name: vendor.name || "",
      fullName: vendor.fullName || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      phone2: vendor.phone2 || "",
      website: vendor.website || "",
      address: vendor.address || "",
      taxNumber: vendor.taxNumber || "",
      registrationNumber: vendor.registrationNumber || "",
      categoryIds: getCategoryIds(vendor.categories),
      type: vendor.type as any,
      status: vendor.status as any,
      paymentTerms: vendor.paymentTerms || "no-payment-terms",
      notes: vendor.notes || "",
    };
  };

  const handleSubmit = async (data: VendorFormData) => {
    setLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        name: data.name.trim(),
        fullName: data.fullName?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        phone2: data.phone2?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        taxNumber: data.taxNumber?.trim() || null,
        registrationNumber: data.registrationNumber?.trim() || null,
        categoryIds: data.categoryIds || [],
        type: data.type,
        status: data.status,
        paymentTerms:
          data.paymentTerms === "no-payment-terms"
            ? null
            : data.paymentTerms?.trim(),
        notes: data.notes?.trim() || null,
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

      await response.json();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor / Supplier/ Provider </DialogTitle>
          <DialogDescription>
            Update vendor information and details.
          </DialogDescription>
        </DialogHeader>

        <VendorForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={getDefaultValues()}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
