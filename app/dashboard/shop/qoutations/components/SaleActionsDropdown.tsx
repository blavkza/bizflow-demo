import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Printer, Mail, MoreHorizontal, Edit } from "lucide-react";
import Link from "next/link";

type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface QuotationActionsDropdownProps {
  quotation: {
    id: string;
    quoteNumber: string;
    customerEmail?: string;
    status: QuoteStatus;
  };
  onPrintReceipt: (quotation: any) => void;
  onEmailReceipt: (quotation: any) => void;
  companyInfo: any | null;
}

export default function QuotationActionsDropdown({
  quotation,
  onPrintReceipt,
  onEmailReceipt,
  companyInfo,
}: QuotationActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href={`/dashboard/shop/quotations/${quotation.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>

        {/*  {quotation.status !== "CONVERTED" &&
          quotation.status !== "CANCELED" && (
            <DropdownMenuItem className="text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Quotation
            </DropdownMenuItem>
          )} */}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onPrintReceipt(quotation)}
          disabled={!companyInfo}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Quotation
        </DropdownMenuItem>

        {quotation.customerEmail && (
          <DropdownMenuItem
            onClick={() => onEmailReceipt(quotation)}
            disabled={!companyInfo}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Quotation
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
