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

interface PrintQuotationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (size: "thermal" | "A4") => void;
  isPrinting: boolean;
}

export default function PrintQuotationDialog({
  isOpen,
  onOpenChange,
  onPrint,
  isPrinting,
}: PrintQuotationDialogProps) {
  const [printSize, setPrintSize] = useState<"thermal" | "A4">("A4");

  const handlePrint = () => {
    onPrint(printSize);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Quotation
          </DialogTitle>
          <DialogDescription>
            Select print size for the quotation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Quotation Size</Label>
            <RadioGroup
              value={printSize}
              onValueChange={(value: "thermal" | "A4") => setPrintSize(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 Size (Standard Printer)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="thermal" />
                <Label htmlFor="thermal" className="font-normal cursor-pointer">
                  Small Receipt (Thermal Printer - 80mm)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-2">Print Preview</h4>
            <div className="text-sm space-y-1">
              <div>
                <strong>Size:</strong>{" "}
                {printSize === "thermal" ? "80mm Thermal" : "A4 Paper"}
              </div>
              <div>
                <strong>Best for:</strong>{" "}
                {printSize === "thermal"
                  ? "Quick receipts, customer copies"
                  : "Formal quotations, records, email attachments"}
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
            disabled={isPrinting}
            className="w-full sm:w-auto"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print Quotation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
