"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuotationWithRelations } from "@/types/quotation";

export const ItemsTable = ({
  quotation,
}: {
  quotation: QuotationWithRelations;
}) => {
  const discountType = quotation?.discountType;
  const subtotal = Number(quotation.amount);

  // Calculate discount amount based on type
  const discountAmount =
    discountType === "PERCENTAGE"
      ? subtotal * (Number(quotation.discountAmount) / 100)
      : Number(quotation.discountAmount);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Tax</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotation.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.description}</TableCell>
            <TableCell>
              {Number(item.quantity).toLocaleString("en-ZA")}
            </TableCell>
            <TableCell>
              R{Number(item.unitPrice).toLocaleString("en-ZA")}
            </TableCell>
            <TableCell>{Number(item.taxRate) || 0}%</TableCell>
            <TableCell>
              R{Number(item.amount).toLocaleString("en-ZA")}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2">
          <TableCell colSpan={4} className="font-medium">
            Subtotal
          </TableCell>
          <TableCell className="font-medium">
            R{subtotal.toLocaleString("en-ZA")}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={4} className="font-medium">
            Tax
          </TableCell>
          <TableCell className="font-medium">
            R{Number(quotation.taxAmount).toLocaleString("en-ZA")}
          </TableCell>
        </TableRow>
        <TableRow className="border-t-2">
          <TableCell colSpan={4} className="font-medium">
            Discount{" "}
            {discountType === "PERCENTAGE" && `(${quotation.discountAmount}%)`}
          </TableCell>
          <TableCell className="font-medium">
            R{discountAmount.toLocaleString("en-ZA")}
          </TableCell>
        </TableRow>
        <TableRow className="border-t-2">
          <TableCell colSpan={4} className="font-bold">
            Total
          </TableCell>
          <TableCell className="font-bold text-green-600">
            R{Number(quotation.totalAmount).toLocaleString("en-ZA")}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
