import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Printer, Mail, RefreshCw, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Sale } from "@/types/sales";
import { CompanyInfo } from "@/lib/receipt-generator";

interface SaleActionsDropdownProps {
  sale: Sale;
  onProcessRefund: (sale: Sale) => void;
  onPrintReceipt: (sale: Sale) => void;
  onEmailReceipt: (sale: Sale) => void;
  companyInfo: CompanyInfo | null;
}

export default function SaleActionsDropdown({
  sale,
  onProcessRefund,
  onPrintReceipt,
  onEmailReceipt,
  companyInfo,
}: SaleActionsDropdownProps) {
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
          <Link href={`/dashboard/shop/sales/${sale.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onPrintReceipt(sale)}
          disabled={!companyInfo}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </DropdownMenuItem>
        {sale.customerEmail && (
          <DropdownMenuItem
            onClick={() => onEmailReceipt(sale)}
            disabled={!companyInfo}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Receipt
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {sale.status === "COMPLETED" && (
          <DropdownMenuItem onClick={() => onProcessRefund(sale)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Refund
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
