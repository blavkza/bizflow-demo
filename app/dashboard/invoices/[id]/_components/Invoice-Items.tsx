"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceProps } from "@/types/invoice";

interface InvoiceItemsProps {
  invoice: InvoiceProps;
}

export default function InvoiceItems({ invoice }: InvoiceItemsProps) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    R{parseFloat(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    R{parseFloat(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R{invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <p>
                    Tax
                    {/* {" "}
                    {invoice.taxRate &&
                      `(${(
                        (Number(invoice.taxAmount) / invoice.amount) *
                        100
                      ).toFixed(2)}%)`} */}
                    :
                  </p>
                </span>
                <span>R{invoice.taxAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span>R{invoice.discountAmount?.toLocaleString() || 0}</span>
              </div>

              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>R{invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
