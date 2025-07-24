import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface DeleteDialogProps {
  invoiceNumber: string;
  invoiceId: string;
}

export function DeleteDialog({ invoiceNumber, invoiceId }: DeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete invoice");
      }

      toast({
        title: "Invoice Deleted",
        description: `Invoice #${invoiceNumber} has been deleted successfully`,
      });

      // Redirect to invoices page
      router.push("/dashboard/invoices");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setConfirmationInput("");
    }
  };

  const isConfirmed = confirmationInput === invoiceNumber;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setConfirmationInput("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Delete invoice">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Invoice #{invoiceNumber}</DialogTitle>
          <DialogDescription className="space-y-4">
            <p className="text-red-600 font-medium">
              This action cannot be undone. This will permanently delete the
              invoice.
            </p>
            <p>
              To confirm, type{" "}
              <span className="font-bold">"{invoiceNumber}"</span> below:
            </p>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Enter ${invoiceNumber}`}
              className="mt-2"
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            aria-label="Cancel deletion"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            aria-label="Confirm deletion"
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
