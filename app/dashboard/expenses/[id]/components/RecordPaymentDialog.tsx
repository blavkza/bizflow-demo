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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Expense } from "../types";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface RecordPaymentDialogProps {
  expense: Expense;
  onPaymentRecorded: () => void;
}

export default function RecordPaymentDialog({
  expense,
  onPaymentRecorded,
}: RecordPaymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    method: "BANK_TRANSFER",
    reference: "",
    notes: "",
  });

  // Convert Decimal to number for comparison
  const remainingAmount = parseFloat(expense.remainingAmount.toString());
  const exceedsRemaining = paymentData.amount > remainingAmount;

  const handleRecordPayment = async () => {
    if (exceedsRemaining) {
      toast.error("Payment amount cannot exceed remaining balance");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/expenses/${expense.id}/payments`, paymentData);
      toast.success("Payment recorded successfully");
      setIsOpen(false);
      setPaymentData({
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        method: "BANK_TRANSFER",
        reference: "",
        notes: "",
      });
      /*       onPaymentRecorded();
       */
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.error || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = value === "" ? 0 : parseFloat(value);
    setPaymentData({
      ...paymentData,
      amount: amount,
    });
  };

  const handleMaxAmount = () => {
    setPaymentData({
      ...paymentData,
      amount: remainingAmount,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} disabled={remainingAmount <= 0}>
          <Plus className="h-4 w-4 mr-2" />
          Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Add a new payment for expense {expense.expenseNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Remaining Amount Display */}
        <div className="bg-muted p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Remaining Balance:</span>
            <span className="text-lg font-bold text-orange-600">
              R{remainingAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="text-sm font-medium">
              R{parseFloat(expense.totalAmount.toString()).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid gap-4 py-4">
          {/* Amount Input with Max Button */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="flex-1"
                min="0"
                max={remainingAmount}
                step="0.01"
                value={paymentData.amount === 0 ? "" : paymentData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxAmount}
                disabled={remainingAmount <= 0}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Validation Message */}
          {exceedsRemaining && (
            <div className="col-span-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
              <AlertCircle className="h-4 w-4" />
              Amount cannot exceed remaining balance of R
              {remainingAmount.toLocaleString()}
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              className="col-span-3"
              value={paymentData.paymentDate}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  paymentDate: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">
              Method
            </Label>
            <Select
              value={paymentData.method}
              onValueChange={(value) =>
                setPaymentData({
                  ...paymentData,
                  method: value,
                })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right">
              Reference
            </Label>
            <Input
              id="reference"
              placeholder="Transaction reference"
              className="col-span-3"
              value={paymentData.reference}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  reference: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentNotes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="paymentNotes"
              placeholder="Payment notes..."
              className="col-span-3"
              value={paymentData.notes}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  notes: e.target.value,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRecordPayment}
            disabled={
              isSubmitting || paymentData.amount <= 0 || exceedsRemaining
            }
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
