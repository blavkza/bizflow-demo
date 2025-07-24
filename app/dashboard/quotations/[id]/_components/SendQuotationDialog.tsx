// components/quotations/SendQuotationDialog.tsx
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
}

export const SendQuotationDialog = ({
  open,
  onOpenChange,
  quotation,
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
      // First generate the PDF
      const pdfUrl = await generatePdfUrl(quotation);

      const response = await fetch("/api/quotations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotation,
          toEmail: email,
          pdfUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Quotation sent successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send quotation. Please try again.");
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
            Send this quotation to the client via email
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

// Helper function to generate PDF URL
async function generatePdfUrl(quotation: QuotationWithRelations) {
  // You'll need to implement this based on your PDF generation logic
  // This could involve:
  // 1. Generating a PDF on the client side (like you're doing in handleDownloadPdf)
  // 2. Uploading it to a storage service (S3, Firebase, etc.)
  // 3. Returning the public URL

  // For now, we'll return null and handle it in the API route
  return null;
}
