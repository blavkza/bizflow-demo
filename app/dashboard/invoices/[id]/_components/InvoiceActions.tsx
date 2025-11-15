"use client";

import { Button } from "@/components/ui/button";
import { Send, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { DeleteDialog } from "./DeleteDialog";
import { InvoiceProps } from "@/types/invoice";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvoiceActionsProps {
  invoice: InvoiceProps;
  isGeneratingPdf: boolean;
  onDownloadPdf: () => void;
  hasFullAccess: boolean;
  canDeleteInvoice: boolean;
  canEditInvoice: boolean;
}

export function InvoiceActions({
  invoice,
  canEditInvoice,
  canDeleteInvoice,
  hasFullAccess,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [email, setEmail] = useState(invoice.client.email || "");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      toast("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice,
          toEmail: email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast(` Invoice has been sent to successfully ${invoice.client.email}`);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error sending email:", error);
      toast("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Send invoice">
            <Send className="mr-2 h-4 w-4" /> Send Invoice
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send invoice #
              {invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {invoice.status !== "PAID" && (
        <>
          {" "}
          {(canEditInvoice || hasFullAccess) && (
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-label="Edit invoice"
            >
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="flex items-center gap-2"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
        </>
      )}

      {invoice.status === "DRAFT" && (
        <>
          {(canDeleteInvoice || hasFullAccess) && (
            <DeleteDialog
              invoiceNumber={invoice.invoiceNumber}
              invoiceId={invoice.id}
            />
          )}
        </>
      )}
    </div>
  );
}
