"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { QuotationWithRelations } from "@/types/quotation";

export const ConvertToInvoiceDialog = ({
  open,
  onOpenChange,
  quotation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationWithRelations;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/quotations/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotationId: quotation.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to convert quotation");
      }

      const { invoice } = await response.json();

      toast.success("Quotation converted to invoice successfully");
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert quotation to invoice");
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Invoice</DialogTitle>
          <DialogDescription>
            This will create a new invoice based on this quotation. The
            quotation status will be updated to "Converted".
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? "Converting..." : "Convert to Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
