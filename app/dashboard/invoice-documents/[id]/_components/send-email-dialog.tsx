// components/send-email-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2 } from "lucide-react";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: InvoiceDocumentWithRelations;
  onSuccess: () => void;
}

// Helper function to get document type label
const getDocumentTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    DELIVERY_NOTE: "Delivery Note",
    PURCHASE_ORDER: "Purchase Order",
    PRO_FORMA_INVOICE: "Pro Forma Invoice",
    CREDIT_NOTE: "Credit Note",
    SUPPLIER_LIST: "Supplier List",
    INVOICE: "Invoice",
  };
  return typeMap[type] || type;
};

export function SendEmailDialog({
  open,
  onOpenChange,
  document,
  onSuccess,
}: SendEmailDialogProps) {
  const [isSending, setIsSending] = useState(false);

  // Get contact email (supplier or client)
  const contactEmail = document.supplier?.email || document.client?.email || "";

  const [to, setTo] = useState(contactEmail);
  const [subject, setSubject] = useState(
    `${document.invoiceDocumentType}: ${document.invoiceDocumentNumber}`
  );
  const [message, setMessage] = useState(
    `Dear ${document.supplier?.name || document.client?.name || "Customer"},

Please find your ${getDocumentTypeLabel(document.invoiceDocumentType).toLowerCase()} ${document.invoiceDocumentNumber} details below.

You can view and download the document online by visiting the link below.

Best regards,
${document.creator?.GeneralSetting?.[0]?.companyName || "Company"}`
  );

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/invoices/documents/${document.id}/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toEmail: to,
            subject,
            message,
            includeAttachment: false,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      const result = await response.json();
      console.log("Email sent successfully:", result);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending email:", error);
      alert(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const documentTypeLabel = getDocumentTypeLabel(document.invoiceDocumentType);
  const companyName =
    document.creator?.GeneralSetting?.[0]?.companyName || "Company";
  const documentUrl = `${window.location.origin}/dashboard/invoice-documents/${document.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Document Notification
          </DialogTitle>
          <DialogDescription>
            Send notification about {documentTypeLabel.toLowerCase()}{" "}
            {document.invoiceDocumentNumber} to the recipient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message here..."
              rows={6}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
