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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface EmailReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendEmail: (email: string, size: "thermal" | "A4") => void;
  isSending: boolean;
  defaultEmail: string;
}

export default function EmailReceiptDialog({
  isOpen,
  onOpenChange,
  onSendEmail,
  isSending,
  defaultEmail,
}: EmailReceiptDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [receiptSize, setReceiptSize] = useState<"thermal" | "A4">("A4");

  const handleSendEmail = () => {
    onSendEmail(email, receiptSize);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Receipt</DialogTitle>
          <DialogDescription>
            Send receipt to customer via email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Receipt Size</Label>
            <RadioGroup
              value={receiptSize}
              onValueChange={(value) =>
                setReceiptSize(value as "thermal" | "A4")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="email-thermal" />
                <Label
                  htmlFor="email-thermal"
                  className="font-normal cursor-pointer"
                >
                  Small Receipt (80mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="email-a4" />
                <Label
                  htmlFor="email-a4"
                  className="font-normal cursor-pointer"
                >
                  A4 Size
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Receipt"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
