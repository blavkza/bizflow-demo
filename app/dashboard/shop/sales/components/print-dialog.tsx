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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, Loader2 } from "lucide-react";
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

interface PrintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  companyInfo: CompanyInfo | null;
}

export function PrintDialog({
  isOpen,
  onOpenChange,
  sale,
  companyInfo,
}: PrintDialogProps) {
  const { toast } = useToast();
  const [printSize, setPrintSize] = useState<"thermal" | "A4">("thermal");
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!sale || !companyInfo) {
      toast({
        title: "Error",
        description: "Sale information or company info is missing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await receiptGenerator.printReceipt(sale, printSize);
      toast({
        title: "Printing Receipt",
        description: `Receipt for ${sale.saleNumber} sent to printer`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Print Failed",
        description: "Could not print receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Receipt
          </DialogTitle>
          <DialogDescription>
            Select print size for receipt {sale.saleNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Print Size Selection */}
          <div className="space-y-3">
            <Label>Receipt Size</Label>
            <RadioGroup
              value={printSize}
              onValueChange={(value: "thermal" | "A4") => setPrintSize(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="thermal" />
                <Label htmlFor="thermal" className="font-normal cursor-pointer">
                  Small Receipt (Thermal Printer - 80mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 Size (Standard Printer)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-2">Print Preview</h4>
            <div className="text-sm space-y-1">
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
                <strong>Size:</strong>{" "}
                {printSize === "thermal" ? "80mm Thermal" : "A4 Paper"}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={loading || !companyInfo}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
