"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
}

export const DeleteQuotationDialog = ({
  open,
  onOpenChange,
  quotationId,
}: DeleteQuotationDialogProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/quotations/${quotationId}`);

      toast.success("Quotation deleted successfully");
      router.push("/dashboard/quotations");
      router.refresh();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast.error("Failed to delete quotation");
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Quotation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this quotation permanently? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            No, keep it
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, delete it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
