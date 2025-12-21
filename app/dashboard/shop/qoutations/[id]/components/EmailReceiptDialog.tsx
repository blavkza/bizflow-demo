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
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface EmailQuotationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendEmail: (email: string, size?: "thermal" | "A4") => void;
  isSending: boolean;
  defaultEmail?: string;
}

export default function EmailQuotationDialog({
  isOpen,
  onOpenChange,
  onSendEmail,
  isSending,
  defaultEmail = "",
}: EmailQuotationDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setSubject("Your Quotation");
      setMessage("Please find your quotation attached.");
      setEmailSent(false);
    }
  }, [isOpen, defaultEmail]);

  const handleSendEmail = () => {
    onSendEmail(email, "A4");
    setEmailSent(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {emailSent ? "Quotation Sent!" : "Email Quotation"}
          </DialogTitle>
          <DialogDescription>
            {emailSent
              ? `Quotation has been sent to ${email}`
              : "Send quotation to customer"}
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="py-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Quotation Sent Successfully!
            </h3>
            <p className="text-muted-foreground">
              The quotation has been sent to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
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

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">
                Email Preview
              </h4>
              <div className="text-sm space-y-1 text-blue-700">
                <div>
                  <strong>Recipient:</strong> {email}
                </div>
                <div>
                  <strong>Subject:</strong> {subject}
                </div>
                <div>
                  <strong>Format:</strong> A4 PDF attached
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
                disabled={isSending || !email.trim()}
                className="w-full sm:w-auto"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Quotation
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
