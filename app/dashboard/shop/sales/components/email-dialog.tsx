"use client";

import { useState, useEffect } from "react";
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
import { Mail, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { receiptGenerator } from "@/lib/receipt-generator";
import { Sale } from "@/types/sales";

interface CompanyInfo {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website: string;
  paymentTerms: string;
  note: string;
  bankAccount: string;
  bankAccount2: string;
  bankName: string;
  bankName2: string;
  logo: string;
  province: string;
  postCode: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
}

interface EmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  companyInfo: CompanyInfo | null;
}

export function EmailDialog({
  isOpen,
  onOpenChange,
  sale,
  companyInfo,
}: EmailDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isOpen && sale) {
      // Reset form when dialog opens
      setEmail(sale.customerEmail || "");
      setSubject(`Receipt ${sale.saleNumber} - Thank you for your purchase`);
      setMessage(`Dear ${sale.customerName || "Valued Customer"},

Thank you for your purchase! Please find your receipt attached.

Best regards,
${companyInfo?.companyName || "Our Team"}`);
      setEmailSent(false);
    }
  }, [isOpen, sale, companyInfo]);

  const handleSendEmail = async () => {
    if (!sale || !companyInfo) {
      toast({
        title: "Error",
        description: "Sale information or company info is missing",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const receiptHTML = await receiptGenerator.generateReceiptForEmail(sale);

      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          html: receiptHTML,
          saleNumber: sale.saleNumber,
          message: message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Receipt Sent",
          description: `Receipt sent to ${email}`,
        });
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error emailing receipt:", error);
      toast({
        title: "Email Failed",
        description: "Failed to send receipt email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {emailSent ? "Receipt Sent!" : "Email Receipt"}
          </DialogTitle>
          <DialogDescription>
            {emailSent
              ? `Receipt has been sent to ${email}`
              : `Send receipt for ${sale.saleNumber} to customer`}
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="py-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Receipt Sent Successfully!
            </h3>
            <p className="text-muted-foreground">
              The receipt has been sent to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Email Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Preview Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">
                Email Preview
              </h4>
              <div className="text-sm space-y-1 text-blue-700">
                <div>
                  <strong>Sale:</strong> {sale.saleNumber}
                </div>
                <div>
                  <strong>Customer:</strong>{" "}
                  {sale.customerName || "Walk-in Customer"}
                </div>
                <div>
                  <strong>Total:</strong> R{sale.total.toFixed(2)}
                </div>
                <div>
                  <strong>Recipient:</strong> {email}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {!emailSent && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={loading || !companyInfo || !email.trim()}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Receipt
                  </>
                )}
              </Button>
            </>
          )}
          {emailSent && (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
