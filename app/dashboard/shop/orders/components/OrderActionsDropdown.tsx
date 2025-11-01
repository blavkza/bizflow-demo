import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Printer, Send, MoreHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface OrderActionsDropdownProps {
  order: Order;
  onPrintReceipt: (orderId: string) => void;
  onSendReceipt: (orderId: string, customerEmail: string) => void;
}

export default function OrderActionsDropdown({
  order,
  onPrintReceipt,
  onSendReceipt,
}: OrderActionsDropdownProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendReceipt = async () => {
    setIsSendingEmail(true);
    try {
      await onSendReceipt(order.id, order.customerEmail);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/shop/orders/${order.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        {/*     <DropdownMenuItem onClick={() => onPrintReceipt(order.id)}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSendReceipt}
          disabled={isSendingEmail || !order.customerEmail}
        >
          {isSendingEmail ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isSendingEmail ? "Sending..." : "Email Receipt"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          Cancel Order
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
