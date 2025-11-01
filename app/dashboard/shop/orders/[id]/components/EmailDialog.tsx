import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailType: "receipt" | "update";
  customerEmail: string;
  onCustomerEmailChange: (email: string) => void;
  onSendEmail: (type: "receipt" | "update", email?: string) => void;
  isSending: boolean;
}

export default function EmailDialog({
  open,
  onOpenChange,
  emailType,
  customerEmail,
  onCustomerEmailChange,
  onSendEmail,
  isSending,
}: EmailDialogProps) {
  const handleSend = () => {
    onSendEmail(emailType, customerEmail);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Customer Email</DialogTitle>
          <DialogDescription>
            Please enter the customer's email address to send the{" "}
            {emailType === "receipt" ? "receipt" : "order update"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email Address</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => onCustomerEmailChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!customerEmail || isSending}>
            {isSending
              ? "Sending..."
              : `Send ${emailType === "receipt" ? "Receipt" : "Update"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
