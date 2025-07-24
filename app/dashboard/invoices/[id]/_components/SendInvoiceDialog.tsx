"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { InvoiceProps } from "@/types/invoice";

interface SendInvoiceDialogProps {
  invoice: InvoiceProps;
}

export function SendInvoiceDialog({ invoice }: SendInvoiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(invoice.client.email || "");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    try {
      setIsSending(true);
      // Send email logic here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="mr-2 h-4 w-4" />
          Send Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice #{invoice.invoiceNumber} to client
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
