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
import { OrderData } from "@/types/order";

interface OrderItemsTableProps {
  orderData: OrderData;
}

export default function OrderItemsTable({ orderData }: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderData.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.product.name}
                </TableCell>
                <TableCell>{item.product.sku}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  R{item.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  R{item.total.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        {/* Order Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R{orderData.subtotal.toFixed(2)}</span>
            </div>

            {orderData.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-R{orderData.discount.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>R{orderData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
