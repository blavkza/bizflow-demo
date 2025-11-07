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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, FileText, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolRentalDetail } from "../types";
import { formatDecimal } from "../utils";

interface QuickActionsProps {
  rental: ToolRentalDetail;
  onRentalUpdated: () => void;
}

export default function QuickActions({
  rental,
  onRentalUpdated,
}: QuickActionsProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [updating, setUpdating] = useState(false);

  const paidAmount = formatDecimal(rental.amountPaid);
  const totalCost = formatDecimal(rental.totalCost);
  const pendingAmount = totalCost - paidAmount;

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please fill in all payment details");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rental.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          method: paymentMethod,
          reference: `PAY-${Date.now()}`,
          notes: `Payment for rental ${rental.id}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Payment recorded successfully");
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
        setPaymentMethod("");
        onRentalUpdated();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Error recording payment");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a payment record for this rental
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={pendingAmount}
              />
              <p className="text-xs text-muted-foreground">
                Outstanding balance: R{pendingAmount.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <select
                className="w-full border rounded-md p-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select method</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={updating || !paymentAmount || !paymentMethod}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
