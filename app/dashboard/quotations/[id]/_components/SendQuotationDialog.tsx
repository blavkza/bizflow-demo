"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QuotationWithRelations } from "@/types/quotation";


interface SendQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationWithRelations;
  refresh?: () => void;
  combineServices: boolean;
  hideItemPrices: boolean;
}

export const SendQuotationDialog = ({
  open,
  onOpenChange,
  quotation,
  refresh,
  combineServices,
  hideItemPrices,
}: SendQuotationDialogProps) => {
  const [email, setEmail] = useState(quotation.client.email || "");
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/quotations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotation,
          toEmail: email,
          combineServices,
          hideItemPrices,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      const result = await response.json();

      toast.success("Quotation sent successfully!");
      onOpenChange(false);

      // Refresh the parent component if needed
      if (refresh) {
        refresh();
      }
    } catch (error) {
      console.error("Error sending quotation email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send quotation. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Quotation</DialogTitle>
          <DialogDescription>
            Send this quotation to the client via email. The quotation will be
            attached as a PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Quotation:</strong> {quotation.quotationNumber}
            </p>
            <p>
              <strong>Client:</strong> {quotation.client.name}
            </p>
            <p>
              <strong>Valid Until:</strong>{" "}
              {new Date(quotation.validUntil).toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "Sending..." : "Send Quotation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
