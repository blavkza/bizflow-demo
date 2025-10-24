import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface BarcodeCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInType: "in" | "out";
  setCheckInType: (type: "in" | "out") => void;
  onScan: (barcode: string) => void;
}

export function BarcodeCheckInDialog({
  open,
  onOpenChange,
  checkInType,
  setCheckInType,
  onScan,
}: BarcodeCheckInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div style={{ display: "none" }} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Barcode Check-In/Out</DialogTitle>
          <DialogDescription>
            Scan employee barcode or QR code, or enter manually
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Check-In Type</Label>
            <Select
              value={checkInType}
              onValueChange={(value: "in" | "out") => setCheckInType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Check In</SelectItem>
                <SelectItem value="out">Check Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <BarcodeScanner onScan={onScan} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
