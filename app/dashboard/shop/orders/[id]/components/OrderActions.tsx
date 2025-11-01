import { Button } from "@/components/ui/button";
import { Send, Edit, Trash2, Printer, Truck, Loader2 } from "lucide-react";
import { OrderData } from "@/types/order";

interface OrderActionsProps {
  orderData: OrderData;
  onEdit: () => void;
  onCancel: () => void;
  onSendReceipt: () => void;
  onSendUpdate: () => void;
  onPrintReceipt: () => void;
  onPrintDeliveryNote: () => void;
  isSendingEmail: boolean;
  isPrintingReceipt?: boolean;
  isPrintingDeliveryNote?: boolean;
  isUpdating?: boolean;
  isCancelling?: boolean;
}

export default function OrderActions({
  orderData,
  onEdit,
  onCancel,
  onSendReceipt,
  onSendUpdate,
  onPrintReceipt,
  onPrintDeliveryNote,
  isSendingEmail,
  isPrintingReceipt = false,
  isPrintingDeliveryNote = false,
  isUpdating = false,
  isCancelling = false,
}: OrderActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      {/* Print Buttons */}
      {/* <Button
        variant="outline"
        size="sm"
        onClick={onPrintReceipt}
        disabled={isPrintingReceipt}
      >
        {isPrintingReceipt ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-2 h-4 w-4" />
        )}
        {isPrintingReceipt ? "Printing..." : "Print Receipt"}
      </Button> */}

      <Button
        variant="outline"
        size="sm"
        onClick={onPrintDeliveryNote}
        disabled={isPrintingDeliveryNote}
      >
        {isPrintingDeliveryNote ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Truck className="mr-2 h-4 w-4" />
        )}
        {isPrintingDeliveryNote ? "Printing..." : "Delivery Note"}
      </Button>

      {/* Email Buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSendReceipt}
        disabled={isSendingEmail}
      >
        {isSendingEmail ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {isSendingEmail ? "Sending..." : "Email Receipt"}
      </Button>

      {/*    <Button
        variant="outline"
        size="sm"
        onClick={onSendUpdate}
        disabled={isSendingEmail}
      >
        {isSendingEmail ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {isSendingEmail ? "Sending..." : "Send Update"}
      </Button> */}

      {/* Action Buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Edit className="mr-2 h-4 w-4" />
        )}
        {isUpdating ? "Updating..." : "Update Order"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={isCancelling || orderData.status === "CANCELLED"}
      >
        {isCancelling ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        {isCancelling ? "Cancelling..." : "Cancel Order"}
      </Button>
    </div>
  );
}
