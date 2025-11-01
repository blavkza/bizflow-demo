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
import { Loader2, Printer } from "lucide-react";

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (size: "thermal" | "A4") => void;
  isPrinting: boolean;
}

export default function PrintReceiptDialog({
  isOpen,
  onOpenChange,
  onPrint,
  isPrinting,
}: PrintReceiptDialogProps) {
  const [printSize, setPrintSize] = useState<"thermal" | "A4">("thermal");

  const handlePrint = () => {
    onPrint(printSize);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Receipt</DialogTitle>
          <DialogDescription>
            Select receipt size and print options
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Receipt Size</Label>
            <RadioGroup
              value={printSize}
              onValueChange={(value) => setPrintSize(value as "thermal" | "A4")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thermal" id="print-thermal" />
                <Label
                  htmlFor="print-thermal"
                  className="font-normal cursor-pointer"
                >
                  Small Receipt (Thermal Printer - 80mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="print-a4" />
                <Label
                  htmlFor="print-a4"
                  className="font-normal cursor-pointer"
                >
                  A4 Size (Standard Printer)
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">
              <div className="font-semibold mb-1">Size Information:</div>
              <div>
                • <strong>Small Receipt (80mm):</strong> Optimized for thermal
                printers, compact format
              </div>
              <div>
                • <strong>A4 Size:</strong> Full-size receipt with detailed
                layout
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="sm:flex-1"
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print {printSize === "thermal" ? "80mm" : "A4"} Receipt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
