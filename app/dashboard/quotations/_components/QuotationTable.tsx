"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Download, Copy, Edit, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  QUOTATION_STATUS,
  QuotationStatusType,
} from "@/lib/constants/quotation";
import { QuotationWithRelations } from "@/types/quotation";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

interface QuotationTableProps {
  quotations: QuotationWithRelations[];
}

export function QuotationTable({ quotations }: QuotationTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quotation #</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Valid Until</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.map((quotation) => (
          <TableRow key={quotation.id}>
            <TableCell className="font-medium">
              <Link
                className=" underline text-blue-500"
                href={`/dashboard/quotations/${quotation.id}`}
              >
                {" "}
                {quotation.quotationNumber}
              </Link>
            </TableCell>
            <TableCell>{quotation.client.name}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {quotation.title}
            </TableCell>
            <TableCell>
              {format(new Date(quotation.issueDate), "MMM dd, yyyy")}
            </TableCell>
            <TableCell>
              {format(new Date(quotation.validUntil), "MMM dd, yyyy")}
            </TableCell>
            <TableCell className="text-right">
              R
              {Number(quotation.totalAmount).toLocaleString("en-ZA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{quotation.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  disabled={loadingId === quotation.id}
                >
                  <Link href={`/dashboard/quotations/${quotation.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
