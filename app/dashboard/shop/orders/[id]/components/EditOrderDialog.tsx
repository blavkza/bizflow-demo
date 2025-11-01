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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusConfig,
  paymentStatusConfig,
  carriers,
  getNextStatusOptions,
} from "../utils";
import { UNSELECTED } from "../utils";
import { OrderData, Employee, OrderStatus, PaymentStatus } from "@/types/order";
import { Loader2 } from "lucide-react";

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: OrderData;
  employees: Employee[];
  editStatus: string;
  editPaymentStatus: string;
  editAssignedTo: string;
  editCarrier: string;
  editDeliveryDate: string;
  editShippingAddress: string;
  editShippingCity: string;
  editShippingProvince: string;
  editShippingPostal: string;
  editShippingCountry: string;
  onEditStatusChange: (status: string) => void;
  onEditPaymentStatusChange: (status: string) => void;
  onEditAssignedToChange: (assignedTo: string) => void;
  onEditCarrierChange: (carrier: string) => void;
  onEditDeliveryDateChange: (date: string) => void;
  onEditShippingAddressChange: (address: string) => void;
  onEditShippingCityChange: (city: string) => void;
  onEditShippingProvinceChange: (province: string) => void;
  onEditShippingPostalChange: (postal: string) => void;
  onEditShippingCountryChange: (country: string) => void;
  onUpdate: () => void;
  isUpdating?: boolean;
}

export default function EditOrderDialog({
  open,
  onOpenChange,
  employees,
  editStatus,
  editPaymentStatus,
  editAssignedTo,
  editCarrier,
  editDeliveryDate,
  editShippingAddress,
  editShippingCity,
  editShippingProvince,
  editShippingPostal,
  editShippingCountry,
  onEditStatusChange,
  onEditPaymentStatusChange,
  onEditAssignedToChange,
  onEditCarrierChange,
  onEditDeliveryDateChange,
  onEditShippingAddressChange,
  onEditShippingCityChange,
  onEditShippingProvinceChange,
  onEditShippingPostalChange,
  onEditShippingCountryChange,
  onUpdate,
  isUpdating = false,
}: EditOrderDialogProps) {
  // Get valid next status options based on current order status
  const nextStatusOptions = getNextStatusOptions(editStatus as OrderStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Order</DialogTitle>
          <DialogDescription>
            Update order status, delivery information, and customer address
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Order Status</Label>
              <Select
                value={editStatus}
                onValueChange={onEditStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      disabled={
                        !nextStatusOptions.includes(key as OrderStatus) &&
                        key !== editStatus
                      }
                    >
                      {config.label}
                      {!nextStatusOptions.includes(key as OrderStatus) &&
                        key !== editStatus &&
                        " (Not available)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only valid status transitions are allowed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-status">Payment Status</Label>
              <Select
                value={editPaymentStatus}
                onValueChange={onEditPaymentStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-assigned-to">Assigned To</Label>
              <Select
                value={editAssignedTo}
                onValueChange={onEditAssignedToChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSELECTED}>Unassigned</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-carrier">Carrier</Label>
              <Select
                value={editCarrier}
                onValueChange={onEditCarrierChange}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSELECTED}>No carrier</SelectItem>
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-delivery-date">Delivery Date</Label>
            <Input
              id="edit-delivery-date"
              type="date"
              value={editDeliveryDate}
              onChange={(e) => onEditDeliveryDateChange(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="Street address"
                  value={editShippingAddress}
                  onChange={(e) => onEditShippingAddressChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  placeholder="City"
                  value={editShippingCity}
                  onChange={(e) => onEditShippingCityChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-province">Province</Label>
                <Input
                  id="edit-province"
                  placeholder="Province"
                  value={editShippingProvince}
                  onChange={(e) => onEditShippingProvinceChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postal">Postal Code</Label>
                <Input
                  id="edit-postal"
                  placeholder="Postal code"
                  value={editShippingPostal}
                  onChange={(e) => onEditShippingPostalChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  placeholder="Country"
                  value={editShippingCountry}
                  onChange={(e) => onEditShippingCountryChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
